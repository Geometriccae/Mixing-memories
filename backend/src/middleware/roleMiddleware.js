const ApiError = require("../utils/ApiError");

function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user) {
      throw new ApiError(401, "Not authorized.");
    }
    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, "Forbidden: insufficient role.");
    }
    next();
  };
}

module.exports = { authorize };
