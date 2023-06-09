import Joi from 'joi'

type Context = {
  keysToValidate?: string[],
  context?: {
    key?: string,
    projectNameMaxLength?: number
  }
}

/**
 * @param {object} schema Schema used for validation
 * @param {object} data Data to test
 * @returns {object} Validation error object
 */
// @ts-ignore
export const schemaValidator = (schema: Record<string, any>, data: Record<string, any>, { keysToValidate, context }: Context = {}): Joi.ValidationError => {
  const validation = schema.validate(data, { abortEarly: false, context }).error?.details || []
  return validation
    .filter((error) => keysToValidate ? keysToValidate.includes(error.context.key) : true)
    .reduce((acc, cur) => ({ ...acc, [cur.context.key]: cur.message }), {})
}

/**
 * @param {object} schema Schema used for validation
 * @param {object} data Data to test
 * @param {object} key Key to test
 * @returns {boolean} Is valid key
 */
export const isValid = (schema, data, key, ctx?) => !schemaValidator(schema, data, { context: ctx })[key]

/**
 * @param {object} model Schema that will be parse
 * @returns {object} Result parsed schema
 */
const parseJoi = (model, value) => Array.from(model.schema._ids._byKey)
// @ts-ignore
  .reduce((acc: Record<string, any>, [key, val]) => ({ ...acc, [key]: instanciateSchema(val, value) }), {})

/**
 * @param {object} model Schema that will be convert
 * @param {any} value Value passed to each key
 * @returns {object} Result schema with all values set to true
 */
export const instanciateSchema = (model, value) => {
  if (model.schema?.type === 'object') {
    return parseJoi(model, value)
  }
  return model.schema?.type
    ? value
    : model
}
