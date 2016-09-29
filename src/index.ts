import * as glob from 'glob';
import mkdirp = require('mkdirp');
import {Schema} from './Schema';
import {generateTemplate} from './templateHelpers';

declare function require(moduleName: string): any;

async function createOutputDir(directory: string): Promise<void> {
    if (!directory) {
        return Promise.resolve();
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
    const files = await Promise.all([
            promisedGlob(globPattern),
            createOutputDir(outputDirectory)
        ])
        .then(results => results[0]);

    // if no files, nothing to do
    if (!files || files.length < 1) {
        console.info('No JSON schema files found');
        return;
    }

    const schemas = files.map(file => new Schema(file, require(file)));

    return Promise.all(schemas.map(schema => generateTemplate(schema, schemas, outputDirectory)))
        .then(files => {
            // remove any empty files
            return files.filter(filename => !!filename);
        });
}