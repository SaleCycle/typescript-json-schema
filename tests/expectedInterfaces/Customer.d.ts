import {Address} from './Address';
import {Name} from './Name';
import {Phone} from './Phone';

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
