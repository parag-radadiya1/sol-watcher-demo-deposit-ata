/**
 * Extracts multipart form data from a request object.
 * @param req - The request object containing multipart form data.
 * @returns An object containing form field values and file data.
 */
export async function extractMultipartValues<T>(req: any): Promise<T> {
  const parts = req.parts();
  const value = {} as T;

  for await (const part of parts) {
    if (part.file) {
      const { fieldname, filename, mimetype } = part;
      const buffer = await part.toBuffer();

      value[fieldname] = {
        filename,
        mimetype,
        size: buffer.length,
        buffer,
      };
    } else {
      value[part.fieldname] = part.value;
    }
  }

  return value;
}
