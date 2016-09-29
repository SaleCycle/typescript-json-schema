import {Schema} from "./Schema";
import {Property} from "./Property";
import * as fs from 'fs';
/// <reference path="../types/left-pad/index.d.ts" />
import leftPad = require('left-pad');

function getRelatedSchema(arrSchemas: Array<Schema>, relatedId: string) {
    const relatedSchema = arrSchemas.find(s => s.id === relatedId);

    if (!relatedSchema) {
        throw new Error(`Could not find referenced schema "${relatedId}"`);
    }

    return relatedSchema;
}

function sortProperties(a: Property, b: Property) {
    // case insensitive sort
    const nameA = a.key.toUpperCase();
    const nameB = b.key.toUpperCase();

    if (nameA < nameB) {
        return -1;
    }
    if (nameA > nameB) {
        return 1;
    }
    return 0;
}

function writeImports(schema: Schema, arrSchemas: Array<Schema>): string {
    if (schema.dependencies.length < 1) {
        return '';
    }

    return schema.dependencies.map(dep => getRelatedSchema(arrSchemas, dep))
            .filter(s => s.type === 'object') // only import objects
            .map(s => `import {${s.title}} from './${s.outputFileName}';`)
            .join(('\n')) + '\n\n';
}

function writeProperties(schema: Schema|Property, arrSchemas: Array<Schema>, indentation: number = 2): string {
    return schema.properties
        .sort(sortProperties)
        .map(property => {
            let result = `${property.key}: `;
            result = leftPad(result, result.length + indentation);

            switch (property.typescriptType) {
                case '___OBJECT___':
                    result += `{\n${writeProperties(property, arrSchemas, (indentation + 2))}\n  };`;
                    break;
                case '___REFERENCE___':
                    const related = getRelatedSchema(arrSchemas, property.ref);

                    if (related.type === 'object') {
                        // if the referenced item is another object - reference it's interface
                        result += `${getRelatedSchema(arrSchemas, property.ref).title};`;
                    } else {
                        // if we get a property which isn't an object, convert it to a property and get it's type
                        const prop = related.toProperty();
                        result += `${prop.typescriptType};`
                    }
                    break;
                default:
                result += `${property.typescriptType};`;
            }

            // if property is not required add the ? after the key
            if (!schema.isPropertyRequired(property.key)) {
                result = result.replace(':', '?:');
            }

            return result;
        })
        .join('\n');
}

async function writeToFile(template: string, schema: Schema, outputDirectory: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const fileName = `${outputDirectory}/${schema.outputFileName}.d.ts`;

        fs.writeFile(fileName, template, (err) => {
            return err ? reject(err) : resolve(fileName);
        });
    });
}

export async function generateTemplate(schema: Schema, arrSchemas: Array<Schema>, outputDirectory: string ='./'): Promise<string> {
    if (schema.type !== 'object') {
        console.warn(schema.title, 'is not of type object so no interface will be created');
        return Promise.resolve('');
    }

    const template = `${writeImports(schema, arrSchemas)}export interface ${schema.title} {\n${writeProperties(schema, arrSchemas)}\n}`;
    return await writeToFile(template, schema, outputDirectory);
}

