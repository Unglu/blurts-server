"use strict";

const test = require("tape-async");

const DB = require("../db/DB");
const getSha1 = require("../sha1-utils");

test("getSubscriberByEmailAndToken accepts email and token and returns subscriber", async t => {
  const testEmail = "unverifiedemail@test.com";
  const testToken = "0e2cb147-2041-4e5b-8ca9-494e773b2cf0";
  const subscriber = await DB.getSubscriberByEmailAndToken(testEmail, testToken);

  t.ok(subscriber.email === testEmail);
  t.ok(subscriber.verification_token === testToken);
});

test("getSubscribersByHashes accepts hashes and only returns verified subscribers", async t => {
  const testHashes = [
    "firefoxaccount@test.com",
    "unverifiedemail@test.com",
    "verifiedemail@test.com",
  ].map(email => getSha1(email));
  const subscribers = await DB.getSubscribersByHashes(testHashes);
  for (const subscriber of subscribers) {
    t.ok(subscriber.verified);
  }
});

test("addSubscriberUnverifiedEmailHash accepts email and returns unverified subscriber with sha1 hash and verification token", async t => {
  const testEmail = "test@test.com";
  // https://stackoverflow.com/a/13653180
  const uuidRE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  const subscriber = await DB.addSubscriberUnverifiedEmailHash(testEmail);
  t.ok(subscriber.sha1 === getSha1(testEmail));
  t.ok(uuidRE.test(subscriber.verification_token));
  t.notOk(subscriber.verified);
});

test("verifyEmailHash accepts token and email and returns verified subscriber", async t => {
  const testEmail = "verifyEmailHash@test.com";

  const unverifiedSubscriber = await DB.addSubscriberUnverifiedEmailHash(testEmail);
  t.notOk(unverifiedSubscriber.verified);

  const verifiedSubscriber = await DB.verifyEmailHash(unverifiedSubscriber.verification_token, unverifiedSubscriber.email);
  t.ok(verifiedSubscriber.sha1 === getSha1(testEmail));
  t.ok(verifiedSubscriber.verified);
});

test("addSubscriber accepts email and returns verified subscriber", async t => {
  const testEmail = "newFirefoxAccount@test.com";

  const verifiedSubscriber = await DB.addSubscriber(testEmail);

  t.ok(verifiedSubscriber.email === testEmail);
  t.ok(verifiedSubscriber.verified);
  t.ok(verifiedSubscriber.sha1 === getSha1(testEmail));
});

test("removeSubscriber accepts email and removes the email address", async t => {
  const testEmail = "removingFirefoxAccount@test.com";

  const verifiedSubscriber = await DB.addSubscriber(testEmail);
  const removedSubscriber = await DB.removeSubscriber(verifiedSubscriber.email);
  console.log("removedSubscriber: ", removedSubscriber);

  t.ok(removedSubscriber.email === null);
});

test("teardown", async t => {
  DB.destroyConnection();
});
