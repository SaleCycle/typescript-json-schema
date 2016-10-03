# JSON schema to TypeScript Interfaces
Simple node module to generate [Typescript interfaces][1] from [JSON Schema][2] files.
This package generates Typescript interfaces (.d.ts files) for a set of related JSON schema documents.

NOTE interface files are not generated for schemas which are not of type "object". At present all referenced
schemas are only looked up against the glob pattern specified.

## Installation

```npm install json-schema-typescript```


## Usage

```
const jsonToTypescript = require('json-schema-typescript');

jsonToTypescript('path/to/schema/**/*.json', './outputDirectory')
    .then(files => console.log(files.length, 'TypeScript interfaces generated'))
    .catch(ex => console.error(ex));
```

```jsonToTypescript(globPattern, [outputDirectory])```
Argument one is a [glob][3] pattern to match against to load schemas.
Argument two is an optional output directory. Defaults to current directory if not specified.

Returns a promise chain which completes with an array of file paths for the interfaces generated.
You should implement a catch function to handle any errors.

## Examples
For examples please see [tests][4] directory in the source code however an example output is shown below.

```
import {Name} from './Name';
import {Phone} from './Phone';
import {Address} from './Address';

export interface Customer {
  address?: Address;
  events?: Array<any|string|number>;
  id: string;
  interests?: Array<string>;
  name: Name;
  optIn?: {
    email?: boolean;
    phone?: boolean;
  };
  phone?: Phone;
  salutation?: string;
}
```

(The above example is generated from [this schema][5])

## Issues/Bugs
Please raise issues on [github][6].


[1]:https://www.typescriptlang.org/docs/handbook/interfaces.html
[2]:http://json-schema.org/
[3]: https://github.com/isaacs/node-glob
[4]: https://github.com/SaleCycle/typescript-json-schema/tree/master/tests
[5]: https://github.com/SaleCycle/typescript-json-schema/blob/master/tests/testSchemas/customer.json
[6]: https://github.com/SaleCycle/typescript-json-schema/issues
