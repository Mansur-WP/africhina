const jsonHeaders = { 'Content-Type': 'application/json' };

export function jsonResponse(data, message = 'OK', status = 200, meta = {}) {
  return new Response(
    JSON.stringify({
      success: true,
      message,
      data,
      meta,
    }),
    {
      status,
      headers: jsonHeaders,
    },
  );
}

export function errorResponse(
  errorCode,
  message,
  status = 400,
  details = null,
) {
  return new Response(
    JSON.stringify({
      success: false,
      message,
      data: null,
      error: {
        code: errorCode,
        message,
        details,
      },
    }),
    {
      status,
      headers: jsonHeaders,
    },
  );
}
