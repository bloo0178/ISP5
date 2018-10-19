/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');
var testID;
var testReplyID;
var deletePassword = 'test1234';

chai.use(chaiHttp);

suite('Functional Tests', function () {

  suite('API ROUTING FOR /api/threads/:board', function () {

    suite('POST', function () {

      test('POST new thread', function (done) {
        chai.request(server)
          .post('/api/threads/testboard')
          .send({ 
            text: 'test #7',
            delete_password: deletePassword
          })
          .end((err, res) => {
            //console.log(res.headers);
            assert.equal(res.status, 200);
            done();
          })
      })

    });

    suite('GET', function () {

      test('GET <=10 most recent threads on a board', (done) => {
        chai.request(server)
          .get('/api/threads/testboard')
          .end((err, res) => {
            //console.log(res.body[0]);
            testID = res.body[0]['_id'];
            assert.equal(res.status, 200);
            assert.isAtMost(res.body.length, 10, 'GET should return 10 or less results');
            assert.notProperty(res.body[0], 'reported');
            assert.notProperty(res.body[0], 'delete_password');
            done();
          })
      })

    });

    suite('DELETE', function () {


      test('DELETE a thread', (done) => {
        chai.request(server)
          .delete('/api/threads/testboard')
          .send({
            thread_id: testID,
            delete_password: deletePassword
          })
          .end((err, res) => {
            assert.equal(res.status, 200); 
            assert.equal(res.body, 'success');
    
            done();
          })
      })

    });

    suite('PUT', function () {

      test('POST another thread to test PUT', (done) => {
        chai.request(server)
        .post('/api/threads/testboard')
        .send({
          text: 'test #9',
          delete_password: deletePassword
        })
        .end((err, res) => {
          done();
        })
      })

      test('GET thread_id to test PUT', (done) => {
        chai.request(server)
        .get('/api/threads/testboard')
        .end((err, res) => {
          testID = res.body[0]['_id']; 
          done();
        })
      })

      test('PUT thread reported value to true', (done) => {
        chai.request(server)
          .put('/api/threads/testboard')
          .send({
            thread_id: testID
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.body, 'success');
            done();
          });
      });

    });

    suite('API ROUTING FOR /api/replies/:board', function () {

      suite('POST', function () {

        test('POST reply', (done) => {
          chai.request(server)
          .post('/api/replies/testboard')
          .send({
            thread_id: testID, 
            text: 'sample reply text',
            delete_password: deletePassword
          })
          .end((err, res) => {
            assert.equal(res.status, 200); 
            //assert.equal(res.body, 'added new reply!'); // may have to change if use redirect
            done(); 
          })
        });

      });

      suite('GET', function () {

        test('GET reply', (done) => {
          chai.request(server)
          .get('/api/replies/testboard') 
          .query({
            thread_id: testID
          })
          .end((err, res) => {
            testReplyID = res.body['replies'][0]['_id']; 
            assert.equal(res.status, 200); 
            //console.log(res.body);
            assert.isObject(res.body); 
            assert.equal(res.body['replies'][0]['text'], 'sample reply text');
            done();
          })
        });

      });

      suite('PUT', function () {

        test('PUT to report reply', (done) => {
          chai.request(server)
          .put('/api/replies/testboard')
          .send({
            thread_id: testID, 
            reply_id: testReplyID
          })
          .end((err, res) => {
            assert.equal(res.status, 200); 
            assert.equal(res.body, 'success'); 
            done();
          })
        });

      });

      suite('DELETE', function () {

        test('DELETE reply', (done) => {
          chai.request(server)
          .delete('/api/replies/testboard')
          .send({
            thread_id: testID, 
            reply_id: testReplyID, 
            delete_password: deletePassword
          })
          .end((err, res) => {
            assert.equal(res.status, 200); 
            assert.equal(res.body, 'success'); 
            done();
          })
        })

      });

    });
  });
});
