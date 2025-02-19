module.exports = {
  hooks: {
    readPackage(pkg) {
      if (pkg.dependencies && pkg.dependencies["@pipedream/connect-react"]) {
        const isDevMode = process.env.LOCAL_CONNECT_REACT === "1" ;

        if (isDevMode) {
          console.log("Using local @pipedream/connect-react");
          pkg.dependencies["@pipedream/connect-react"] = "file:../../pipedream/packages/connect-react";
        }
      }
      return pkg;
    },
  },
};
