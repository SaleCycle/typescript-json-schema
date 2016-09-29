import * as glob from 'glob';
import mkdirp = require('mkdirp');
import {Schema} from './Schema';
import {generateTemplate} from './templateHelpers';

declare function require(moduleName: string): any;

async function createOutputDir(directory: string): Promise<void> {
    if (!directory) {
        return;
    }

    return new Promise((resolve, reject) => {
        mkdirp(directory, (err) => {
            return err ? reject(err) : resolve();
        });
    });
}

async function promisedGlob(globPattern: string): Promise<Array<string>> {
    return new Promise<Array<string>>((resolve, reject) => {
        glob(globPattern, (err, files) => {
            return err ? reject(err) : resolve(files);
        });
    });
}

export = async function (globPattern: string, outputDirectory: string): Promise<Array<string>> {
    const files = await promisedGlob(globPattern);

    // if no files, nothing to do
    if (!files || files.length < 1) {
        return;
    }

    // create the output directory
    await createOutputDir(outputDirectory);

    const schemas = files.map(file => new Schema(file, require(file)));

    return Promise.all(schemas.map(schema => generateTemplate(schema, schemas, outputDirectory)));

}