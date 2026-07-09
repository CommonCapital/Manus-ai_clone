// Sample TypeScript file for testing batch_edit
import { oldFunction } from './utils';

export function hello() {
  const result = oldFunction();
  console.log('Hello from sample1');
  return result;
}

export const config = {
  version: '1.0.0',
  name: 'oldName'
};