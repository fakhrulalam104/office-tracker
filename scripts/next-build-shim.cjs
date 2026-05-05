const Module = require("module");
const fs = require("fs");

const originalLoad = Module._load;
const originalWriteFile = fs.promises.writeFile.bind(fs.promises);

fs.promises.writeFile = async function writeFileWithFallback(file, data, options) {
  try {
    return await originalWriteFile(file, data, options);
  } catch (error) {
    if (!error || error.code !== "EPERM") {
      throw error;
    }

    if (typeof options === "string" || (options && typeof options === "object")) {
      fs.writeFileSync(file, data, options);
    } else {
      fs.writeFileSync(file, data);
    }
  }
};

Module._load = function patchedLoad(request, parent, isMain) {
  const parentFile = parent && parent.filename ? parent.filename.replace(/\\/g, "/") : "";

  if (request === "./report" && /\/next\/dist\/trace\/trace\.js$/.test(parentFile)) {
    return {
      reporter: {
        flushAll: async () => {},
        report: () => {}
      }
    };
  }

  return originalLoad.apply(this, arguments);
};
