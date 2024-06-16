# Smart Optimizer

[![NPM Version][npm-image]][npm-url]
[![Build Status][build-image]][build-url]
[![License][license-image]][license-url]

Smart Optimizer is an efficient image compression and resizing middleware for `Node.js` applications. Using `TypeScript`, `Multer`, `Tsup`, and `Sharp`, it allows you to compress images before uploading, manage file sizes, and specify image quality. Perfect for optimizing image uploads in your web applications.

## Features

- **File Compression**: Compress images before uploading with a boolean flag.
- **File Size Ratio**: Automatically create multiple image sizes based on specified ratios.
- **Image Quality**: Set image quality from 1 to 100.
- **Local Path**: Specify a local path where processed images are saved.

## Installation

Install the package using npm:

```bash
npm install smart-optimizer
```

## Usage

### Setting Up Middleware

To use Smart Optimizer as middleware in your application, follow these steps:

 1. Import Dependencies:

 ```javascript
 const UploadManager = require("smart-optimizer").default;
 ```
 OR

 ```javascript
 import uploadManager from 'smart-optimizer'
 ```

 2. Initialize Middleware:

 ```javascript 
 exports.uploadPic = async (req, res, next) => {
  let imagePath = [];
  const uploader = new UploadManager({
    fileCompression: true,
    fileResizeRatio : [[100,100],[200,200]], //optional
    allowExtension: ["jpeg", "jpg", "png"], // you can add more extension also.
    imageQuality: 70,
    localPath: "public/img", 
  });
  uploader.uploadFiles(req, res, function (err, uploadResponse) {
    if (err) {
      console.log("Error:", err);
      return next(err);
    }
    if (uploadResponse.code === 200) {
      req.file = uploadResponse.data[0];
      next();
    } else {
      console.log("Upload failed with code:", err);
      res.status(500).send("Upload failed");
    }
  });
};
 ```

 3. Routes

 ```javascript
 app.post('/upload',uploadPic, (req, res) => {
    // Respond with the details of the processed image
    if (req.file) {
        console.log("Upload files", req.file);
    } else {
        console.log("No Files  uploaaded");
    }
    res.status(200).json({
        success: true,
        message: "Image",
    });
 });

 ```

## Return Object

After the image is processed and uploaded, the middleware will add the processed file information to req.file. This object contains details about the uploaded file, such as its filename, size, and path.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

## Issues

If you encounter any issues, please open an issue on `GitHub` Issues.