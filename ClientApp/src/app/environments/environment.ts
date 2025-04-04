// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  baseUrl: "http://localhost:4200",
  authUrl: "https://authentik.tekonline.com.au",
  clientId: "2IMb22Ysgo9cnfjX3wrHmvidZRZrtAtbfrEEdzJp",
  redirectUri: "http://localhost:4200/callback",
  endpoints: {
    authorize: "/application/o/authorize/",
    token: "/application/o/token/",
    userInfo: "/application/o/userinfo/",
    revoke: "/application/o/revoke/",
    endSession: "/application/o/localparts/end-session/",
    jwks: "/application/o/localparts/jwks/",
    openIdConfig: "/application/o/localparts/.well-known/openid-configuration"
  }
};

  /*
   * For easier debugging in development mode, you can import the following file
   * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
   *
   * This import should be commented out in production mode because it will have a negative impact
   * on performance if an error is thrown.
   */
  // import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
