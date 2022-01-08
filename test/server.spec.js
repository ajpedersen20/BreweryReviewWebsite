// Imports the server.js file to be tested.
const server = require("../server");
// Assertion (Test Driven Development) and Should,  Expect(Behaviour driven 
// development) library
const chai = require("chai");
// Chai HTTP provides an interface for live integration testing of the API's.
const chaiHttp = require("chai-http");
chai.should();
chai.use(chaiHttp);
const { assert, expect } = chai;

// Things to be added and checked for in database
const name = "testName";
const review = "Good";

describe("Server!", () => {

  it('It should add review to db when sent review info', (done) => {
    chai
      .request(server)
      .post('/reviews/add')
      .send({breweryName: name, reviewBody: review})
      .end((err, response) => {
        expect(response).to.have.status(200);
        let obj = false;
        let i;
        for(i = 0; i < response.body.result.length; i+=1){
            if(response.body.result[i].name == name)
                obj = true;
        }
        assert.equal(obj, true);
        done();
      });
  });
  
  it('It should return correct review when sent brewery name', (done) => {
    chai
      .request(server)
      .post('/reviews/filter')
      .send({filter: name})
      .end((err, response) => {
        expect(response).to.have.status(200);
        assert.equal(response.body.result, name);
        done();
      });
  });

});
