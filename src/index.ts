import multer, { Multer } from "multer";
import moment from "moment";
import path from "path";
import sharp from "sharp"; //image compress package

interface UploadOptions {
  fileCompression?: boolean;
  fileResizeRatio?: [number, number][] | null;
  allowExtension?: string[] | null;
  imageQuality?: number;
  localPath: string;
  basePath: string;
}

interface FileData {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  filename: string;
  destination: string;
}

/**
 * UploadManager class
 * @class
 * @classdesc A class for managing file uploads.
 */

class UploadManager {
  /**
   * Create an instance of UploadManager.
   * @constructor
   * @param {Object} [options={}] - The options for configuring UploadManager.
   * @param {boolean} [options.fileCompression=false] - Whether to compress the uploaded files.
   * @param {Array} [options.fileResizeRatio=null] - An array of image resize ratios.
   * @param {Array} [options.allowExtension=null] - An array of allowed file extensions.
   * @param {number} options.imageQuality - The quality of the uploaded file.
   * @param {string} options.localPath - The local path of the uploaded file when environment is LOCAL.
   *
   * @return The uploaded file array of object.
   */

  private options: UploadOptions;
  private upload: Multer;

  constructor(options: UploadOptions) {
    this.options = {
      fileCompression: options.fileCompression || false,
      fileResizeRatio: options.fileResizeRatio || null,
      allowExtension: options.allowExtension || null,
      imageQuality: options.imageQuality ?? 80,
      basePath : options.basePath || process.cwd(),
      localPath: options.localPath || "../public",
    };

    this.upload = multer({
      storage: multer.memoryStorage(),
      fileFilter: this.fileFilter.bind(this),
    });
  }
  private fileFilter(req: any, file: Express.Multer.File, cb: any) {
    const extensions = this.options.allowExtension || ["jpeg", "jpg", "png"];
    const filetypes = new RegExp(`(${extensions.join("|")})`);

    const extname = filetypes.test(file.originalname.split(".").pop() ?? " ");
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype || extname) {
      cb(null, true);
    } else {
      cb({ data: {}, code: 400 });
    }
  }
  private async compressAndResizeImage(
    file: Express.Multer.File,
    size: [number, number],
    imageQuality: number
  ): Promise<Buffer> {
    const [width, height] = size;
    const compressedImageBuffer = await sharp(file.buffer)
      .resize({
        width: width,
        height: height,
      })
      .jpeg({ quality: imageQuality });

    const output = await compressedImageBuffer.toBuffer();

    file.buffer = output;
    return file.buffer;
  }

  /**
   *
   * Compresses the image contained in the given file buffer using the specified
   * image quality, and saves the compressed image to the file's destination path.
   *
   * @async
   * @function compressImage
   * @memberof UploadManager
   *
   * @param {Object} file - The file object containing the file data like `file.buffer` etc
   * @param {number} imageQuality - The image quality to use when compressing the image, expressed as a number between 0 and 100.
   * @returns {Promise<Buffer>} A promise that resolves with the compressed image buffer.
   */

  private async compressImage(
    file: Express.Multer.File,
    imageQuality: number
  ): Promise<Buffer> {
    const compressedImageBuffer = await sharp(file.buffer).jpeg({
      quality: imageQuality,
    });
    const output = await compressedImageBuffer.toBuffer();

    file.buffer = output;
    return file.buffer;
  }

  private async resizeImage(
    file: Express.Multer.File,
    size: [number, number]
  ): Promise<Buffer> {
    const [width, height] = size;
    const resizedImageBuffer = await sharp(file.buffer).resize({
      width: width,
      height: height,
    });

    const output = await resizedImageBuffer.toBuffer();

    file.buffer = output;
    return file.buffer;
  }

  /**
   * Processes an image by compressing and resizing it according to the options provided.
   *
   * @param {Buffer} image - The image buffer to be processed.
   * @param {Object} options - The options for processing the image.
   * @param {boolean} [options.compress=false] - Whether to compress the image.
   * @param {number} [options.quality=80] - The quality of the compressed image (0-100).
   * @param {Array} [options.sizes=[]] - An array of objects specifying the sizes to which the image should be resized.
   * @param {number} options.sizes[].width - The width to which the image should be resized.
   * @param {number} options.sizes[].height - The height to which the image should be resized.
   *
   */

  private async processImage(file: Express.Multer.File): Promise<FileData[]> {
    file.filename = `${file.fieldname}_${moment().unix()}.jpeg`;

    file.destination = path.resolve(
      this.options.basePath,
      this.options.localPath,
      file.filename
    );
    

    // file.contenttype = "image/jpeg";
    const uploadDataList: FileData[] = [];

    if (this.options.fileCompression && this.options.fileResizeRatio) {
      const bufferData = file.buffer;
      for (const size of this.options.fileResizeRatio) {
        const [width, height] = size;
        const fileName = `${
          file.fieldname
        }_${width}x${height}_${moment().unix()}.jpeg`;
        file.filename = fileName;
        file.destination = path.resolve(
          __dirname,
          path.resolve(__dirname, this.options.localPath),
          fileName
        );
        file.buffer = bufferData;
        await this.compressAndResizeImage(
          file,
          size,
          this.options.imageQuality!
        );
        await sharp(file.buffer).toFile(file.destination);
        uploadDataList.push({
          fieldname: file.fieldname,
          originalname: file.originalname,
          encoding: file.encoding,
          mimetype: file.mimetype,
          filename: file.filename,
          destination: file.destination,
        });
      }
      return uploadDataList;
    } else if (this.options.fileResizeRatio != null) {
      const bufferData = file.buffer;
      for (const size of this.options.fileResizeRatio) {
        const [width, height] = size;
        const fileName = `${
          file.fieldname
        }_${width}x${height}_${moment().unix()}.jpeg`;
        file.filename = fileName;
        file.destination = path.resolve(
          __dirname,
          path.resolve(__dirname, this.options.localPath),
          fileName
        );
        file.buffer = bufferData;
        await this.resizeImage(file, size);
        await sharp(file.buffer).toFile(file.destination);
        uploadDataList.push({
          fieldname: file.fieldname,
          originalname: file.originalname,
          encoding: file.encoding,
          mimetype: file.mimetype,
          filename: file.filename,
          destination: file.destination,
        });
      }
      return uploadDataList;
    } else if (this.options.fileCompression) {
      file.buffer = await this.compressImage(file, this.options.imageQuality!);
      await sharp(file.buffer).toFile(file.destination);
      return [
        {
          fieldname: file.fieldname,
          originalname: file.originalname,
          encoding: file.encoding,
          mimetype: file.mimetype,
          filename: file.filename,
          destination: file.destination,
        },
      ];
    } else {
      await sharp(file.buffer).toFile(file.destination);
      return [
        {
          fieldname: file.fieldname,
          originalname: file.originalname,
          encoding: file.encoding,
          mimetype: file.mimetype,
          filename: file.filename,
          destination: file.destination,
        },
      ];
    }
  }

  public async uploadFiles(
    req: any,
    res: any,
    callback: (err: any, data?: any) => void
  ) {
    this.upload.any()(req, res, async (err: any) => {
      if (err) {
        console.log("Error uploading file:", err);
        callback(err);
        return;
      }
      try {
        const uploadedImageDataArr: FileData[] = [];
        for (const file of req.files) {
          if (file.mimetype.startsWith("image/")) {
            const uploadedImageData = await this.processImage(file);
            uploadedImageDataArr.push(...uploadedImageData);
          } else {
            file.filename = `${
              file.fieldname
            }_${moment().unix()}.${file.originalname.split(".").pop()}`;
            file.contenttype = file.mimetype;
          }
        }
        callback(null, { data: uploadedImageDataArr, code: 200 });
      } catch (err) {
        console.log("Error uploading file:", err);
        callback(err);
      }
    });
  }
}

export default UploadManager;
