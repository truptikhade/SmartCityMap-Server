import res from "../utils/response.js";
const { errorResponse } = res;

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const message = error.details[0].message.replace(/['"]/g, "");
      return errorResponse(res, 400, message);
    }

    next();
  };
};

export default validate; // ← must be export validate, not export default { validate }
