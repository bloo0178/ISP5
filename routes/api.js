'use strict';
require('dotenv').config()
const mongoose = require('mongoose');

var expect = require('chai').expect;

module.exports = function (app) {

  var threadSchema = new mongoose.Schema({
    board: String,
    text: String,
    replies: [],
    delete_password: String,
    created_on: Date,
    bumped_on: Date,
    reported: Boolean
  })

  var Thread = mongoose.model('Thread', threadSchema);

  var replySchema = new mongoose.Schema({
    text: String,
    delete_password: String,
    created_on: Date,
    reported: Boolean
  });

  var Reply = mongoose.model('Reply', replySchema);

  app.route('/api/threads/:board')
    .post((req, res) => {
      console.log('POST req.body.text: ' + req.body.text);
      let newThread = new Thread({
        board: req.params.board,
        text: req.body.text,
        delete_password: req.body.delete_password, 
        created_on: new Date(),
        bumped_on: new Date(),
        reported: false
      });
      /*newThread.save((err) => { //how to return the doc in the body to get the new thread_ID ???
        if (err) return res.json(err);
        //return res.json('saved!'); //NOTE FROM REQS: Recomend res.redirect to thread page /b/{board}/{thread_id}
        res.redirect('/b/' + req.params.board);
      })*/
      Thread.create(newThread, (err, thread) => {
        console.log(thread);
        if (err) return res.json(err); 
        res.redirect('/b/' + req.params.board + '/' + thread._id);
      
      })
    })
    .delete((req, res) => {
      console.log('req.body.thread_id: ' + req.body.thread_id);
      Thread.findById(req.body.thread_id, (err, thread) => {
        //console.log(thread);
        if (err) return res.json(err.message); 
        if (!thread) return res.json('record not found');
        if (req.body.delete_password == thread.delete_password) {
          Thread.findByIdAndDelete(req.body.thread_id, (err, deletedThread) => {
            return res.json('success') 
          })
        } else {
        res.json('incorrect password');
        }
      })
    })
    .get((req, res) => {
      Thread.find({ board: req.params.board },
        ['_id', 'text', 'replies', 'created_on', 'bumped_on'],
        {
          sort: { bumped_on: -1 },
          limit: 10
        }, (err, docs) => {
          var filteredResult = docs.map(x => {
            var filteredRepliesArray = [...x['replies']];
            //Slice the replies array to return only 3 most recent items if more than 3 exist
            if (x['replies'].length > 3) {
              filteredRepliesArray = x['replies'].sort().reverse();
              filteredRepliesArray = filteredRepliesArray.slice(0, 3);
            }
            //Perform another map to hide/ only return certain fields for each 'reply' item
            filteredRepliesArray = filteredRepliesArray.map(x => {
              return ({
                '_id': x['_id'],
                'text': x['text'],
                'created_on': x['created_on']
              })
            })
            return ({
              '_id': x['_id'],
              'text': x['text'],
              'created_on': x['created_on'],
              'bumped_on': x['bumped_on'],
              'replies': filteredRepliesArray,
            })
          })
          res.json(filteredResult);
        })
    })
    //PUT allows user to report a thread (change reported to true)
    .put((req, res) => {
      console.log('thread_id: ' + req.body.thread_id);
      Thread.findByIdAndUpdate(req.body.thread_id,
        { reported: true }, (err, result) => {
          if (err) return res.json(err.message);     
          console.log(result);
           res.json('success');
        })
    })

  app.route('/api/replies/:board')
    .post((req, res) => {
      let newReply = new Reply({
        text: req.body.text,
        delete_password: req.body.delete_password,
        reported: false,
        created_on: new Date()
      });
      Thread.findByIdAndUpdate(req.body.thread_id,
        {
          $push: { replies: newReply },
          bumped_on: new Date()
        }, (err, doc) => {
          if (err) res.json(err);
          res.redirect('/b/' + req.params.board + '/' + req.body.thread_id); 
          //res.json('added new reply!') //(Recomend res.redirect to thread page /b/{board}/{thread_id})
        }
      )
    })
    .get((req, res) => {
      let board = req.params.board;
      let thread_id = req.query.thread_id;
      Thread.findOne({ board: board, _id: thread_id }, (err, result) => {
        let returnObj = {};
        let returnRepliesArr = [];
        result['replies'].forEach(x => {
          returnRepliesArr.push({
            '_id': x['_id'],
            'text': x['text'],
            'created_on': x['created_on'],
          })
        });
        returnObj = {
          '_id': result['_id'],
          'board': result['board'],
          'text': result['text'],
          'created_on': result['created_on'],
          'bumped_on': result['bumped_on'],
          'replies': returnRepliesArr
        }
        res.json(returnObj);
      })
    })
    .delete((req, res) => { //change to be like the delete for threads; more error handling
      Thread.findById(req.body.thread_id, (err, thread) => {
        var replyDeleteIndex = thread['replies'].findIndex(x => {
          return x._id == req.body.reply_id && x.delete_password == req.body.delete_password;
        });
        if (replyDeleteIndex == -1) {
          res.json('incorrect password');
        } else {
          var repliesArrCopy = [...thread['replies']];
          repliesArrCopy.splice(replyDeleteIndex, 1);
          Thread.findByIdAndUpdate(req.body.thread_id,
            { replies: repliesArrCopy },
            (err, result) => {
              if (err) res.json(err);
              res.json('success');
            })
        }
      })
    })
    //PUT allows user to report a post (change reported to true)
    .put((req, res) => {
      Thread.findById(req.body.thread_id, (err, thread) => {
        var modifyReplyIndex = thread['replies'].findIndex(x => {
          return x._id == req.body.reply_id;
        })
        if (modifyReplyIndex == -1) {
          res.json('no record found to report');
        }
        else {
          var repliesArrCopy = [...thread['replies']];
          repliesArrCopy[modifyReplyIndex].reported = true;
          Thread.findByIdAndUpdate(req.body.thread_id,
            { replies: repliesArrCopy }, (err, result) => {
              if (err) res.json(err);
              res.json('success');
            })
        }
      })
    })

};
