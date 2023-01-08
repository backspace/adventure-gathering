import { all } from 'rsvp';
import { run } from '@ember/runloop';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';

import page from '../pages/teams';

module('Acceptance | teams', function(hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function(assert) {
    const store = this.owner.lookup('service:store');
    const done = assert.async();

    run(() => {
      const teamOne = store.createRecord('team');
      const teamTwo = store.createRecord('team');

      teamOne.setProperties({
        name: 'Team 1',
        riskAversion: 3,
        phones: [
          {number: '2045551212', displaySize: '5.5'}
        ]
      });

      teamTwo.setProperties({
        name: 'Team 2',
        riskAversion: 1,
        phones: [
          {number: '2040000000', displaySize: '4'},
          {number: '5140000000', displaySize: '5'}
        ]
      });

      all([teamOne.save(), teamTwo.save()]).then(() => {
        done();
      });
    });
  });

  test('existing teams are listed', function(assert) {
    page.visit();

    assert.equal(page.teams().count, 2, 'expected two teams to be listed');

    assert.equal(page.teams(0).name, 'Team 1');
    assert.equal(page.teams(0).riskAversion, '3');
    assert.equal(page.teams(0).phones, '2045551212: 5.5');

    assert.equal(page.teams(1).name, 'Team 2');
    assert.equal(page.teams(1).riskAversion, '1');
    assert.equal(page.teams(1).phones, '2040000000: 4, 5140000000: 5');
  });

  test('teams can be overwritten with JSON input', (assert) => {
    page.visit();

    page.enterJSON(`
      {
        "data": [
          {
            "type": "teams",
            "id": 100,
            "attributes": {
              "name": "jorts",
              "users": "jorts@example.com, jants@example.com",
              "notes": "some notes",
              "phones": [
                {"number": "2041231234", "displaySize": "5.75"}
              ],
              "riskAversion": 2
            }
          },
          {
            "type": "teams",
            "id": 200,
            "attributes": {
              "name": "jants",
              "riskAversion": 2
            }
          }
        ]
      }
    `);

    page.save();

    assert.equal(page.teams().count, 2, 'expected two teams to be listed');

    assert.equal(page.teams(0).name, 'jorts');
    assert.equal(page.teams(0).users, 'jorts@example.com, jants@example.com');
    assert.equal(page.teams(0).phones, '2041231234: 5.75');
    assert.equal(page.teams(0).notes, 'some notes');
    assert.equal(page.teams(0).riskAversion, '2');

    assert.equal(page.teams(1).name, 'jants');
    assert.equal(page.teams(1).riskAversion, '2');
  });
});
