import * as glob from 'glob';
import {Schema} from './Schema';
import {generateTemplate, writeToFile} from './templateHelpers';

declare function require(moduleName: string): any;

async function promisedGlob(globPattern: string): Promise<Array<string>> {
    return new Promise<Array<string>>((resolve, reject) => {
        glob(globPattern, (err, files) => {
            return err ? reject(err) : resolve(files);
        });
    });
}

export = async function (globPattern: string): Promise<Array<string>> {
    const files = await promisedGlob(globPattern);

    const schemas = files.map(file => new Schema(file, require(file)));

    return schemas.map(schema => generateTemplate(schema));
}