import { CompositeQueryTransformation } from './CompositeQueryTransformation.ts';

import {
  WrapMysqlModifySubqueryTransformation,
} from './WrapMysqlModifySubqueryTransformation.ts';

export const transformation = new CompositeQueryTransformation([
  new WrapMysqlModifySubqueryTransformation(),
]);
