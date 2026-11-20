// Wraps a route so that any error is passed to the error handler in server.js
// instead of crashing the server.

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
