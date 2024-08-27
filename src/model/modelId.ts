import { Model } from './Model.ts';

function getSetId(model: Model, maybeId) {
  if (maybeId !== undefined) {
    return setId(model, maybeId);
  } else {
    return getId(model);
  }
}

function hasId(model: Model) {
  return model.$hasProps(model.constructor.getIdPropertyArray());
}

function setId(model: Model, id) {
  const idProp = model.constructor.getIdProperty();
  const isCompositeId = Array.isArray(idProp);

  if (Array.isArray(id)) {
    if (isCompositeId) {
      if (id.length !== idProp.length) {
        throw new Error('trying to set an invalid identifier for a model');
      }

      for (let i = 0; i < id.length; ++i) {
        model[idProp[i]] = id[i];
      }
    } else {
      if (id.length !== 1) {
        throw new Error('trying to set an invalid identifier for a model');
      }

      model[idProp] = id[0];
    }
  } else {
    if (isCompositeId) {
      if (idProp.length > 1) {
        throw new Error('trying to set an invalid identifier for a model');
      }

      model[idProp[0]] = id;
    } else {
      model[idProp] = id;
    }
  }
}

function getId(model: Model) {
  const idProp = model.constructor.getIdProperty();
  const isCompositeId = Array.isArray(idProp);

  if (isCompositeId) {
    return model.$values(idProp);
  } else {
    return model[idProp];
  }
}
