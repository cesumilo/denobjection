import { nany } from '../ninja.ts';
import { QueryBuilderOperationSupport } from './QueryBuilderOperationSupport.ts';
import { KnexOperation } from './operations/KnexOperation.ts';

export class JoinBuilder extends QueryBuilderOperationSupport<nany> {
  using(...args: nany[]) {
    return this.addOperation(new KnexOperation('using'), args);
  }

  on(...args: nany[]) {
    return this.addOperation(new KnexOperation('on'), args);
  }

  orOn(...args: nany[]) {
    return this.addOperation(new KnexOperation('orOn'), args);
  }

  onBetween(...args: nany[]) {
    return this.addOperation(new KnexOperation('onBetween'), args);
  }

  onNotBetween(...args: nany[]) {
    return this.addOperation(new KnexOperation('onNotBetween'), args);
  }

  orOnBetween(...args: nany[]) {
    return this.addOperation(new KnexOperation('orOnBetween'), args);
  }

  orOnNotBetween(...args: nany[]) {
    return this.addOperation(new KnexOperation('orOnNotBetween'), args);
  }

  onIn(...args: nany[]) {
    return this.addOperation(new KnexOperation('onIn'), args);
  }

  onNotIn(...args: nany[]) {
    return this.addOperation(new KnexOperation('onNotIn'), args);
  }

  orOnIn(...args: nany[]) {
    return this.addOperation(new KnexOperation('orOnIn'), args);
  }

  orOnNotIn(...args: nany[]) {
    return this.addOperation(new KnexOperation('orOnNotIn'), args);
  }

  onNull(...args: nany[]) {
    return this.addOperation(new KnexOperation('onNull'), args);
  }

  orOnNull(...args: nany[]) {
    return this.addOperation(new KnexOperation('orOnNull'), args);
  }

  onNotNull(...args: nany[]) {
    return this.addOperation(new KnexOperation('onNotNull'), args);
  }

  orOnNotNull(...args: nany[]) {
    return this.addOperation(new KnexOperation('orOnNotNull'), args);
  }

  onExists(...args: nany[]) {
    return this.addOperation(new KnexOperation('onExists'), args);
  }

  orOnExists(...args: nany[]) {
    return this.addOperation(new KnexOperation('orOnExists'), args);
  }

  onNotExists(...args: nany[]) {
    return this.addOperation(new KnexOperation('onNotExists'), args);
  }

  orOnNotExists(...args: nany[]) {
    return this.addOperation(new KnexOperation('orOnNotExists'), args);
  }

  type(...args: nany[]) {
    return this.addOperation(new KnexOperation('type'), args);
  }

  andOn(...args: nany[]) {
    return this.addOperation(new KnexOperation('andOn'), args);
  }

  andOnIn(...args: nany[]) {
    return this.addOperation(new KnexOperation('andOnIn'), args);
  }

  andOnNotIn(...args: nany[]) {
    return this.addOperation(new KnexOperation('andOnNotIn'), args);
  }

  andOnNull(...args: nany[]) {
    return this.addOperation(new KnexOperation('andOnNull'), args);
  }

  andOnNotNull(...args: nany[]) {
    return this.addOperation(new KnexOperation('andOnNotNull'), args);
  }

  andOnExists(...args: nany[]) {
    return this.addOperation(new KnexOperation('andOnExists'), args);
  }

  andOnNotExists(...args: nany[]) {
    return this.addOperation(new KnexOperation('andOnNotExists'), args);
  }

  andOnBetween(...args: nany[]) {
    return this.addOperation(new KnexOperation('andOnBetween'), args);
  }

  andOnNotBetween(...args: nany[]) {
    return this.addOperation(new KnexOperation('andOnNotBetween'), args);
  }

  andOnJsonPathEquals(...args: nany[]) {
    return this.addOperation(new KnexOperation('andOnJsonPathEquals'), args);
  }

  onVal(...args: nany[]) {
    return this.addOperation(new KnexOperation('onVal'), args);
  }

  andOnVal(...args: nany[]) {
    return this.addOperation(new KnexOperation('andOnVal'), args);
  }

  orOnVal(...args: nany[]) {
    return this.addOperation(new KnexOperation('orOnVal'), args);
  }
}
