import {Property} from './Property';
import {Schema} from './Schema';
import * as fs from 'fs';
/// <reference path="../types/left-pad/index.d.ts" />
import leftPad = require('left-pad');

/**
 * Find the related schema when referenced from a property
 * Throws error if schema could not be found
 * @param arrSchemas {Array<Schema>} the array of schema's we have imported to search through
 * @param relatedId {String} the ID for the schema we need to find
 * @returns {Schema} The referenced schema
 */
function getRelatedSchema(arrSchemas: Array<Schema>, relatedId: string): Schema {
  // find schema by ID
  const relatedSchema = arrSchemas.find(s => s.id === relatedId);

  if (!relatedSchema) {
    throw new Error(`Could not find referenced schema "${relatedId}"`);
  }

  return relatedSchema;
}

/**
 * Sort the properties in the outputed interface by key alphabetically (case insensitive)
 * @param a {Property} the first property to compare
 * @param b {Property} the second property to compare
 * @returns {number} 0 if equal, 1 if a should come after b, -1 if b should come after a
 */
function sortProperties(a: Property, b: Property): number {
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

function sortImports(a: Schema, b: Schema): number {
  const nameA = `./${a.outputFileName}`;
  const nameB = `./${b.outputFileName}`;

  if (nameA < nameB) {
    return -1;
  }
  if (nameA > nameB) {
    return 1;
  }
  return 0;
}

/**
 * Create module import statements for any referenced schemas (if applicable)
 * NOTE imports are only created when the referenced schema is of type object.
 * @param schema {Schema} the schema to generate imports for
 * @param arrSchemas {Array<Schema>} the array of schemas to search through to find referenced schemas
 * @returns {string} a string of imports for the supplied schemas (empty string if no imports required)
 */
function writeImports(schema: Schema, arrSchemas: Array<Schema>): string {
  if (schema.dependencies.length < 1) {
    return '';
  }

  return schema.dependencies
      .map(dep => getRelatedSchema(arrSchemas, dep)) // find the related schema
      .filter(s => s.type === 'object') // only import if schema is of type object
      .sort(sortImports)
      .map(s => `import {${s.title}} from './${s.outputFileName}';`) // generate ES6 module import
      .join(('\n')) + '\n\n'; // write each import to a new line, leave 2 lines between imports and the interface definition
}

/**
 * Write each one of the properties and it's relevant type as detailed in the schema to the interface file recursively
 * @param schema {Schema} the schema to get the properties from
 * @param arrSchemas {Array<Schema>} the array of all known schemas used to lookup $ref properties by id
 * @param indentation {number} the number of spaces to pad from the left (for style only)
 * @returns {string} the properties of the schema with their associated typescript types
 */
function writeProperties(schema: Schema|Property, arrSchemas: Array<Schema>, indentation: number = 2): string {
  return schema.properties
    .sort(sortProperties) // sort properties alphabetically
    .map(property => {
      // get the key and sort the indentation out
      let result = `${property.key}: `;
      result = leftPad(result, result.length + indentation);

      switch (property.typescriptType) {
        case '___OBJECT___':
          // if the property is an object, create a child object using it's properties (and indent them an extra 2 spaces)
          result += `{\n${writeProperties(property, arrSchemas, (indentation + 2))}\n  };`;
          break;
        case '___REFERENCE___':
          // if the property references another schema, find the related schema (this will throw if not found so no need to check)
          const related = getRelatedSchema(arrSchemas, property.ref);

          if (related.type === 'object') {
            // if the referenced item is another object - reference it's interface
            result += `${getRelatedSchema(arrSchemas, property.ref).title};`;
          } else {
            // if we get a property which isn't an object, convert it to a property and get it's type
            const prop = related.toProperty();
            result += `${prop.typescriptType};`;
          }
          break;
        default:
          // by default write the property type
          result += `${property.typescriptType};`;
      }

      // if property is not required add the ? after the key
      if (!schema.isPropertyRequired(property.key)) {
        result = result.replace(':', '?:');
      }

      return result;
    })
    .join('\n'); // write each property on it's own line
}

/**
 * Do the writing to disk
 * @param template {string} the generated interface to write to disk
 * @param schema {Schema} the schema we're writing (used to get the file name)
 * @param outputDirectory {string} the directory to write the files to (defaults to current directory if not specified)
 * @returns {Promise<string>} a promise which completes when the file has been written returning the file path of the created file
 */
async function writeToFile(template: string, schema: Schema, outputDirectory: string = './'): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const fileName = `${outputDirectory}/${schema.outputFileName}.d.ts`;

    fs.writeFile(fileName, template, (err) => {
      return err ? reject(err) : resolve(fileName);
    });
  });
}

/**
 * Generate the TypeScript interface file and write it to disk
 * @param schema {Schema} the schema to generate the interface for
 * @param arrSchemas {Array<Schema>} the array of all schemas we know about (used to look up related schemas)
 * @param outputDirectory {String} the directory to write the files to (defaults to current directory if not specified)
 * @returns {Promise<string>} a promise which completes when the file has been written returning the file path of the created file
 */
export async function generateInterfaceFile(schema: Schema, arrSchemas: Array<Schema>, outputDirectory: string): Promise<string> {
  if (schema.type !== 'object') {
    // if the schema is not an object schema we can't create an interface for it, just log and return
    console.warn(schema.title, 'is not of type object so no interface will be created');
    return Promise.resolve('');
  }

  // generate the template and write it (this is all on 1 line to avoid extra spaces)
  const template = `${writeImports(schema, arrSchemas)}export interface ${schema.title} {\n${writeProperties(schema, arrSchemas)}\n}\n`;
  return await writeToFile(template, schema, outputDirectory);
}
