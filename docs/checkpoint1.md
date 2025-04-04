for context, check out ../README.md
1. Get a docker stack up with postgres and postgrest. It should have JWT and rls set up. oauth2 info is in security.md [DONE]
2. Strip out everything in the angular app in ClientApp except for core ops. navbar, home page (make that just say something basic) and JWT and anything to do with token handling. so when we are done, the user should be able to login, and use the test route to updaate a value in the db. [DONE]
3. put a test path in with a test component. on the test component, hit the postgrest endpoint to test data updates on the server.
    3.1 [incomplete] aftrer following these two tutorials https://docs.postgrest.org/en/v12/tutorials/tut0.html and https://docs.postgrest.org/en/v12/tutorials/tut1.html we get invalid signature. we need to create another endpoint that returns the jwt settings that are on the server along with the token and the decoded key 
        3.1.1 [DONE] we can succseffuly retrieve the server settings including the jwt aud. So thats a start
        3.1.2 [DONE] create a script that: creates a jwt which matches the postgrest jwt details (go find them). use that jwt to post test data to a test(maybe you will need to create this) end point which returns the jwt data. This will be a test step to get jwt working. Its located in the /examples/jwt-postgrest-example folder
        3.2.3 Mod this script to use pkce
        3.1.4 [in progress] look at the working example and update security to ensure we are working within the limitations of postgrest [Done]
        3.1.5 Spin up the client app and see if we get a token back from authentik.
        3.1.6 make sure postgrest is set up with authentik relevant auth settings.
        3.1.7 [progress] we get this {"code":"PGRST301","details":null,"hint":null,"message":"JWSError (CompactDecodeError Invalid number of parts: Expected 3 parts; got 1)"}. Lets look at how our test is sending the jwt in the /examples/jwt-postgrest-example to see where the issue is
        3.1.8 [DONE]Postgrest needs a client secret, but authentik will not give a secret for a public client. Therefore, Create a small middleware container with an endpoint that can take the signed jwts from authentik and modify them to make them work with postgrest. Im new to how signing keys work but I can see where I can download.
        3.1.9 Middleware works. but we get invalid aud from the postgrest endpoint. Can we turn off aud validation in postgrest?
        3.1.10 [DONE] We are now just creating the jwt in the middleware which is working but is not secure because everyone will  but we need to allow tokens from the clientapp. Its this point that we could run into trouble. So this is how we will manage things. We will use the middleware to validate the token. Once the token is validated, we can generate a new one hat postgrest is happy with and make sure we pass enough info so that rls will work.
        3.1.11 [DONE][IN PROGRESS] JWT and RLS Configuration
            - Current Status: JWT transformation is working but encountering RLS policy violation
            - Issue: Row-level security policy violation for the test table
            - Solution Steps:
                1. Modified test table to use TEXT for user_id instead of UUID
                2. RLS policies are correctly configured to match JWT claims
                3. Added comprehensive test endpoint (/runtest) that:
                   - Performs all CRUD operations in sequence
                   - Returns detailed results for each step
                   - Helps verify RLS policies are working correctly
                4. Next steps:
                   - Test the new endpoint with transformed JWT
                   - Verify RLS policies are working as expected
                   - Document the complete authentication flow

here is the issue we get: {
	"code": "42501",
	"details": null,
	"hint": null,
	"message": "new row violates row-level security policy for table \"test\""
}
3.1.12 [DONE] Because the step prior works, we now need to check why that works and our regular post data doesnt
3.1.13 [DONE] our /runtest endpoint works.
3.1.14 [DONE] we are stuck in a loop. we need to include userid in the post to make the insert work but that then means the JWT is almost useless for rls. we need to check if the runtest endpoint includes a user id in its post. Perhaps we could use the middleware to translate the jwt so that the user id is included in the post? THat sounds hacky though but might be a good intermediate test
3.1.15 [DONE] the prev step worked. We now need to mod the runtest endpoint to get the userid from the jwt so we can test if postgrest can use it - ensure we are following https://docs.postgrest.org/en/v12/references/auth.html guide as a start. explain the significance of the claim called "role". It seems to hold the userid like this {
  "role": "user123"
} 
3.1.16 we seem to have an ish with the runtest endpoint we get this {
	"code": "42P01",
	"details": null,
	"hint": null,
	"message": "relation \"api.runtest\" does not exist"
}

[Done] We finally got the runtest endpoint working with rls. 
4. We now need to modify the runtest endpoint to add in steps that overrides the user name on one pass so that we can ensure rls working. on the first pass we can use the current user. On the second we can use a test user.

