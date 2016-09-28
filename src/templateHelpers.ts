import {Schema} from "./Schema";
import {writeFile} from 'fs';

function writeProperties(schema: Schema): string {
    return schema.properties
        .sort((a, b) => {
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
        })
        .map(property => {
            let result = ` ${property.key}: ${property.typescriptType};`;

            // if property is not required add the ? after the key
            if (!schema.isRequired(property.key)) {
                result = result.replace(':', '?;');
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

export async function writeToFile(template: string, schema: Schema): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const fileName = `${schema.title}.d.ts`;

        writeFile(fileName, template, (err) => {
            return err ? reject(err) : resolve(fileName);
        });
    });
}