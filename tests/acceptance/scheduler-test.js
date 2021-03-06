import { all } from 'rsvp';
import { run } from '@ember/runloop';
import { test } from 'qunit';
import moduleForAcceptance from 'adventure-gathering/tests/helpers/module-for-acceptance';

import page from '../pages/scheduler';
import destinationsPage from '../pages/destinations';

moduleForAcceptance('Acceptance | scheduler', {
  beforeEach(assert) {
    const store = this.application.__container__.lookup('service:store');
    const db = this.application.__container__.lookup('adapter:application').get('db');
    const done = assert.async();

    run(() => {
      const portagePlace = store.createRecord('region', {
        name: 'Portage Place',
        notes: 'Downtown revitalisation!',
        x: 50,
        y: 60
      });

      const eatonCentre = store.createRecord('region', {
        name: 'Eaton Centre',
        x: 100,
        y: 100
      });

      const circus = store.createRecord('region', {name: 'Portage and Main Circus'});

      const superfans = store.createRecord('team', {
        name: 'Leave It to Beaver superfans',
        users: 'june@example.com, eddie@example.com',
        notes: 'Here is a note',
        riskAversion: 3,
      });

      const mayors = store.createRecord('team', {
        name: 'Mayors',
        users: 'susan@winnipeg.ca, glen@winnipeg.ca',
        riskAversion: 1
      });

      const pyjamaGamers = store.createRecord('team', {name: 'The Pyjama Gamers'});

      const pathfinderData = {
        _id: 'pathfinder-data',
        data: {
          'Portage Place|Eaton Centre': 5
        }
      };

      let edmontonCourt, prairieTheatreExchange, globeCinemas, squeakyFloor, mrGreenjeans, sculpture;

      all([portagePlace.save(), eatonCentre.save(), circus.save(), superfans.save(), mayors.save(), pyjamaGamers.save(), db.put(pathfinderData)]).then(() => {
        edmontonCourt = store.createRecord('destination', {
          region: portagePlace,
          description: 'Edmonton Court',
          accessibility: 'Steps down to centre',
          awesomeness: 3,
          risk: 2,
          status: 'available'
        });

        prairieTheatreExchange = store.createRecord('destination', {
          description: 'Prairie Theatre Exchange',
          awesomeness: 4/3,
          risk: 1,
          region: portagePlace,
          status: 'available'
        });

        globeCinemas = store.createRecord('destination', {
          region: portagePlace,
        });

        squeakyFloor = store.createRecord('destination', {
          region: eatonCentre,
          status: 'unavailable'
        });

        mrGreenjeans = store.createRecord('destination', {
          description: 'Mr. Greenjeans',
          region: eatonCentre,
          status: 'available'
        });

        sculpture = store.createRecord('destination', {
          region: circus,
          status: 'unavailable'
        });

        return all([edmontonCourt.save(), prairieTheatreExchange.save(), globeCinemas.save(), squeakyFloor.save(), mrGreenjeans.save(), sculpture.save()]);
      }).then(() => {
        return all([portagePlace.save(), eatonCentre.save(), circus.save()]);
      }).then(() => {
        return store.createRecord('meeting', {
          destination: edmontonCourt,
          offset: 15,
          teams: [superfans, mayors]
        }).save();
      }).then(() => {
        return all([edmontonCourt.save(), superfans.save(), mayors.save()]);
      }).then(() => {
        done();
      });
    });
  }
});

test('available destinations are grouped by region', (assert) => {
  page.visit();

  andThen(() => {
    assert.equal(page.regions().count, 2, 'only regions with available destinations should be listed');
    const region = page.regions(1);

    assert.equal(region.name, 'Portage Place');
    assert.equal(region.notes, 'Downtown revitalisation!');

    assert.equal(region.destinations().count, 2);
    const destination = region.destinations(0);

    assert.equal(destination.description, 'Edmonton Court');
    assert.equal(destination.qualities, 'A3 R2');
    assert.equal(destination.accessibility, 'Steps down to centre');

    // getComputedStyle is returning 0.298039 despite the style attribute value of 0.3!
    assert.ok(Math.abs(destination.awesomenessBorderOpacity - 0.3) < 0.01);
    assert.equal(destination.riskBorderOpacity, 0.2);
  });
});

test('regions with available destinations are displayed on the map and highlight when hovered in the column', (assert) => {
  page.visit();

  const region = page.map.regions(1);

  andThen(() => {
    assert.equal(region.x, 50);
    assert.equal(region.y, 60);
    assert.notOk(region.isHighlighted, 'expected region not to be highlighted');
  });

  andThen(() => {
    page.regions(1).hover();
  });

  andThen(() => {
    assert.ok(region.isHighlighted, 'expected region to be highlighted');
  });

  andThen(() => {
    page.regions(1).exit();
  });

  andThen(() => {
    assert.notOk(region.isHighlighted, 'expected region not to be highlighted');
  });
});

// This test ensures that a region’s destinations are serialised
test('a newly created and available destination will show under its region', (assert) => {
  withSetting('destination-status');
  destinationsPage.visit();
  destinationsPage.new();
  destinationsPage.descriptionField.fill('Fountain');

  andThen(() => {
    const portagePlaceOption = find('option:contains(Portage Place)');
    destinationsPage.regionField.select(portagePlaceOption.val());
  });

  destinationsPage.save();

  destinationsPage.destinations(0).status.click();

  page.visit();

  andThen(() => {
    const region = page.regions(1);
    assert.equal(region.destinations().count, 3);
  });
});

test('a destination with a meeting is indicated', (assert) => {
  destinationsPage.visit();

  andThen(() => {
    assert.ok(destinationsPage.destinations(0).hasMeetings, 'expected the first destination to have meetings');
    assert.notOk(destinationsPage.destinations(1).hasMeetings, 'expected the second destination not to have meetings');
  });
});

test('teams are listed', (assert) => {
  page.visit();

  andThen(() => {
    const superfans = page.teams(0);
    assert.equal(superfans.name, 'Leave It to Beaver superfans');
    assert.equal(superfans.riskAversionColour, 'red');
    assert.equal(superfans.usersAndNotes, 'june@example.com, eddie@example.com\n\nHere is a note');

    assert.ok(superfans.isAhead, 'expected team with meeting to be ahead');
    assert.ok(page.teams(1).isAhead, 'expected team with meeting to be ahead');

    assert.notOk(page.teams(2).isAhead, 'expected team with no meeting not to be ahead');
  });
});

test('an existing meeting is shown in the teams and destination', (assert) => {
  page.visit();

  andThen(() => {
    assert.equal(page.teams(0).count, '•');
    assert.equal(page.teams(0).averageAwesomeness, '3');
    assert.equal(page.teams(0).averageRisk, '2');

    assert.equal(page.teams(1).count, '•');

    assert.equal(page.map.regions(1).count, '1');

    // FIXME the border is currently 2*meetingCount because the style property
    // was somehow overwritten?
    assert.equal(page.regions(1).destinations(0).meetingCountBorderWidth, '2px');
  });
});

test('hovering over a team shows its destinations ordered on the map, its meetings, and teams it’s met', (assert) => {
  page.visit();

  andThen(() => {
    page.teams(0).hover();
  });

  andThen(() => {
    assert.equal(page.map.regions(1).meetingIndex, '1');

    assert.equal(page.teams(0).meetings().count, 1);
    assert.equal(page.teams(0).meetings(0).index, '0');
    assert.equal(page.teams(0).meetings(0).offset, '15');

    assert.ok(page.teams(1).isHighlighted, 'expected the met team to be highlighted');
    assert.notOk(page.teams(2).isHighlighted, 'expected the other team to not be highlighted');
  });
});

test('an existing meeting can be edited', assert => {
  page.visit();

  // This seems necessary to have the fake hover event actually work.
  andThen(() => {
    page.teams(0).hover();
  });

  andThen(() => {
    page.teams(0).meetings(0).click();
  });

  andThen(() => {
    assert.equal(page.meeting.destination, 'Edmonton Court');
    assert.equal(page.meeting.teams(0).value, 'Leave It to Beaver superfans');
    assert.equal(page.meeting.teams(1).value, 'Mayors');
  });
});

test('a new meeting can be scheduled and resets the form when saved', (assert) => {
  page.visit();

  page.regions(1).destinations(1).click();
  page.teams(1).click();
  page.teams(0).click();

  andThen(() => {
    assert.equal(page.meeting.destination, 'Prairie Theatre Exchange');
    assert.equal(page.meeting.teams(0).value, 'Leave It to Beaver superfans');
    assert.equal(page.meeting.teams(1).value, 'Mayors');
    assert.notOk(page.meeting.isForbidden, 'expected meeting not be forbidden');
    assert.equal(page.meeting.index, '1');
    assert.equal(page.meeting.offset, '15');

    assert.ok(page.regions(1).destinations(1).isSelected);
    assert.notOk(page.regions(1).destinations(0).isSelected);

    assert.equal(page.map.regions(1).count, '2');

    assert.ok(page.teams(1).isSelected);
    assert.ok(page.teams(0).isSelected);
  });

  page.meeting.fillOffset('18');
  page.meeting.save();

  andThen(() => {
    assert.equal(page.teams(0).count, '••');
    assert.equal(page.teams(0).averageAwesomeness, '2.17');
    assert.equal(page.teams(0).averageRisk, '1.5');

    assert.equal(page.teams(1).count, '••');

    assert.equal(page.regions(1).destinations(1).meetingCountBorderWidth, '2px');

    assert.equal(page.meeting.teams().count, 0, 'expected no set teams after saving');
  });

  page.regions(0).destinations(0).click();
  page.teams(1).click();
  page.teams(0).click();

  andThen(() => {
    assert.equal(page.meeting.offset, '23');
  });
});

test('scheduling a meeting between teams with different meeting counts is impossible', (assert) => {
  page.visit();

  page.regions(1).destinations(1).click();
  page.teams(1).click();
  page.teams(2).click();

  andThen(() => {
    assert.ok(page.meeting.isForbidden, 'expected meeting to be forbidden');
    assert.ok(page.meeting.saveIsHidden, 'expected save button to be hidden');
  });
});

test('a partially-complete meeting can be cleared', (assert) => {
  page.visit();

  page.teams(1).click();
  page.teams(0).click();

  page.meeting.reset();

  andThen(() => {
    assert.equal(page.meeting.teams().count, 0);
  });
});
