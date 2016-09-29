import {Schema} from "./Schema";
import {Property} from "./Property";
/// <reference path="../types/left-pad/index.d.ts" />
import leftPad = require('left-pad');

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

function writeProperties(schema: Schema|Property, indentation: number = 2): string {
    return schema.properties
        .sort(sortProperties)
        .map(property => {
            let result = `${property.key}: `;
            result = leftPad(result, result.length + indentation);

            switch (property.typescriptType) {
                case '___OBJECT___':
                    result += `{\n${writeProperties(property, (indentation + 2))}\n  };`;
                    break;
                case '___ARRAY___':
                    //do thing;
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

/**
 * Created by steve.jenkins on 28/09/2016.
 */
export function generateTemplate(schema: Schema): string {
    return `export interface ${schema.title} {\n${writeProperties(schema)}\n}`;
}
/*

export async function writeToFile(template: string, schema: Schema): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const fileName = `${schema.title}.d.ts`;

        writeFile(fileName, template, (err) => {
            return err ? reject(err) : resolve(fileName);
        });
    });
}*/
