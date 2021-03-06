import { all, Promise as EmberPromise } from 'rsvp';
import { run } from '@ember/runloop';
import { test } from 'qunit';
import moduleForAcceptance from 'adventure-gathering/tests/helpers/module-for-acceptance';

import page from '../pages/regions';
import destinationsPage from '../pages/destinations';
import mapPage from '../pages/map';

moduleForAcceptance('Acceptance | regions', {
  beforeEach(assert) {
    const store = this.application.__container__.lookup('service:store');
    const db = this.application.__container__.lookup('adapter:application').get('db');
    const done = assert.async();

    run(() => {
      const fixtureOne = store.createRecord('region');
      const fixtureTwo = store.createRecord('region');

      fixtureOne.setProperties({
        name: 'Gujaareh',
        notes: 'City of Dreams',
        x: 50,
        y: 10
      });
      fixtureTwo.setProperties({
        'name': 'Kisua',
        x: -100,
        y: 1000
      });

      const pathfinderData = {
        _id: 'pathfinder-data',
        data: {
          'Jellevy|Kisua': 3
        }
      };

      all([fixtureTwo.save(), fixtureOne.save(), db.put(pathfinderData)]).then(() => {
        const attachment = 'iVBORw0KGgoAAAANSUhEUgAAACgAAAAkCAYAAAD7PHgWAAAEcElEQVRYR8WYP2hTQRzHfx10aQchi0JcLGpBSBcrlTrpIjoFiy6FDipOHVz8Q0HrUGxdg1N1KBRBackiVoQ6FMVIuzQgpEpdjOiSLUXQIfK9976X37t3l6RNxVuS3Hvv7nPf3+/3vcvraTQaDdlFK4z3yMT8rh7d0Ww97QAzfX12wFq9br4buOk7UpicaQm5F4toCajh9LKnLm23Bex0Ee3k7ArwS/mVvH5elqEzzWmGr0dhDwGGFs3ouMAdA7491y+Dhw5KZuG9UEEA1r6XZfhUPOxgQ0pzPQJIDTi11NtOKOkKkHCcpfDrjQlxaXnGdFE1fAcg2to7sWmgAfVYWCzbPwO06imNHt0Tyd/IyfDlrYRy7kI3fvyUsyvRPbsCxIPIGQ6MAdFWD5RbKnjxZhTSWn0+AqyuS2agEPWNjZhPjrUngBgQkABDQ3hNOJdnmvkXa5UZ6W2CxXBaRoBiLLR2cLgnUSRIbOSLlptVx8LQk7k5iHutah44Pks12+VfApBVh04YsAbV1yR7sslYXU+oSPUK46NWZWPmseJdATLfTJ5UJsxYBNXqoc+EeX7RgpbmRmX1pcjsSq95VkP5AM1czMl63ViS27iNen2QYSUoH+bWVq1WpTh5OAFp1ekbtz7JRVJBPH/+Sk6O5i4YQCxc57Sbq0i1loA2R6hKfDho7rFLqZWzYvXiqCKgSi/6LSC+o7l2ZCIWz5UChHqfH2alvPVVRp/sT4Q7P/1NstmssZ6okNKAyD803+5BICjohjm90qgnAajhcNEHiP7BgQHZqFQkK49FF40uDtyHrZAKEQ6/NWDIoAkcBAQcmpuHoZWG+l1IwlHBjgGp3rP1zchi4kpG3vi+7wQUkMgz5p8tKIwdnzHbhtiatALTRcLvtBnmmc/ANQCuo3JxLGMF6+tmHFUULqgJsUl6Bwy/jXr1elQUWlGnj37JyfQksBhWL/tpM/itK9kHanOQ3rd47bcZxxSIkl97ow67u2Lfouh/+l6EnIvXuU5/TNkMAAjnA7RhUf9RQkWkTRhh9TUCuuO6kUooCMBc/xHzzLG71ZYJjAUhPD6TDUERxoXTC7CRiqOXAIRBZ/J5e3/oXxvhdE6FqpA2g+sslFaA3iLRMmvfYz6l8ixWD/3adF0bwXUNiN87gcP9qfOg72jkepVWkIC6ELQZu5BdAWIwbSl6F9AWQEAXRB8GtOpaxa4BCan3Tp3cemJ3G9R+R/g9DbGenDtLCJQVHIL0AeqKb7fFkaWjdzMIrz4+afdvpWKoslks+Lx9YltufQy/hPICUj1OQAOHR9KGeABwAfk6xOeFOmdrxaI5c6Ktffgjs5/4VzV6QRVUkKcafRMHQh8hQ9udPrm4ChJQw7n3EJYp4D0PPl3YlKtjx+0K3UEAiZ3G9T3fATWRd5UJ8cEBCm3o9D47Fc8CKUCEEw/om/kUD7H4zY2e+Vh8UJb8/fTrDt+BA8/rfZ/j63m9gLSYUHL7Ks99ndZpdYZew3Fub4hbVd3/uvYXfqiMwjPten8AAAAASUVORK5CYII=';
        return db.putAttachment('map', 'map.png', attachment, 'image/png');
      }).then(() => done());
    });
  }
});

test('existing regions are listed', function(assert) {
  page.visit();

  andThen(function() {
    assert.equal(page.regions().count, 2, 'expected two regions to be listed');
    assert.equal(page.regions(0).name, 'Gujaareh');
    assert.equal(page.regions(1).name, 'Kisua');

    assert.notOk(page.regions(0).isIncomplete, 'expected Gujaareh not to be incomplete because this is not txtbeyond');
  });
});

test('regions have a completion status for txtbeyond', function(assert) {
  withSetting('txtbeyond');
  page.visit();

  andThen(() => {
    assert.ok(page.regions(0).isIncomplete, 'expected Gujaareh to be incomplete');
    assert.notOk(page.regions(1).isIncomplete, 'expected Kisua to be complete');
  })
});

test('a region can be created, will appear at the top of the list, and be the default for a new destination', (assert) => {
  page.visit();

  page.new();
  page.nameField.fill('Jellevy');
  page.save();

  andThen(() => {
    assert.equal(page.regions(0).name, 'Jellevy');
  });

  destinationsPage.visit();
  destinationsPage.new();

  andThen(() => {
    // FIXME this is an unpleasant way to find the label of the selected value
    const id = destinationsPage.regionField.value;
    assert.equal(find(`option[value='${id}']`)[0].innerHTML, 'Jellevy');
  });
});

test('a region can be edited and edits can be cancelled', (assert) => {
  page.visit();

  page.regions(0).edit();

  andThen(() => {
    assert.equal(page.nameField.value, 'Gujaareh');
    assert.equal(page.notesField.value, 'City of Dreams');
  });

  page.nameField.fill('Occupied Gujaareh');
  page.save();

  andThen(() => {
    const region = page.regions(0);
    assert.equal(region.name, 'Occupied Gujaareh');
  });

  page.regions(0).edit();
  page.nameField.fill('Gujaareh Protectorate');
  page.cancel();

  andThen(() => {
    assert.equal(page.regions(0).name, 'Occupied Gujaareh');
  });
});

test('an edited region is the default for a new destination', (assert) => {
  page.visit();

  page.new();
  page.nameField.fill('Jellevy');
  page.save();

  page.regions(2).edit();
  page.nameField.fill('Kisua Protectorate');
  page.save();

  destinationsPage.visit();
  destinationsPage.new();

  andThen(() => {
    // FIXME see above
    const id = destinationsPage.regionField.value;
    assert.equal(find(`option[value='${id}']`)[0].innerHTML, 'Kisua Protectorate');
  });
});

test('a region can be deleted', (assert) => {
  page.visit();
  page.regions(0).edit();
  page.delete();

  andThen(() => {
    assert.equal(page.regions().count, 1);
  });
});

test('the regions can be arranged on a map', (assert) => {
  page.visit();
  page.visitMap();

  andThen(() => {
    assert.equal(mapPage.regions(0).name, 'Gujaareh');
    assert.equal(mapPage.regions(0).y, 10);
    assert.equal(mapPage.regions(0).x, 50);

    assert.equal(mapPage.regions(1).name, 'Kisua');
    assert.equal(mapPage.regions(1).y, 1000);
    assert.equal(mapPage.regions(1).x, 0);

    // This needs to be inside andThen to get offset?!
    // mapPage.regions(0).dragBy(90, 10);
  });

  andThen(() => {
    // FIXME it works in development… 😳
    // assert.equal(mapPage.regions(1).x(), 100);
    // assert.equal(mapPage.regions(1).y(), 60);
  });
});

moduleForAcceptance('Acceptance | regions with no map');

test('a new map can be uploaded', (assert) => {
  page.visit();
  page.visitMap();

  andThen(() => {
    // FIXME had to turn this off after the 2.18 update
    // assert.ok(mapPage.imageSrc() === '', 'expected no img src');

    // This has to happen inside andThen to change the file input
    mapPage.setMap('R0lGODlhDwAPAKECAAAAzMzM/////wAAACwAAAAADwAPAAACIISPeQHsrZ5ModrLlN48CXF8m2iQ3YmmKqVlRtW4MLwWACH+H09wdGltaXplZCBieSBVbGVhZCBTbWFydFNhdmVyIQAAOw==');
  });

  andThen(() => {
    assert.ok(mapPage.imageSrc.indexOf('blob') > -1, 'expected new img src to have a blob URL');
  });
});

moduleForAcceptance('Acceptance | regions with existing map', {
  beforeEach() {
    const db = this.application.__container__.lookup('adapter:application').get('db');

    return new EmberPromise(() => {
      run(() => {
        const attachment = 'iVBORw0KGgoAAAANSUhEUgAAACgAAAAkCAYAAAD7PHgWAAAEcElEQVRYR8WYP2hTQRzHfx10aQchi0JcLGpBSBcrlTrpIjoFiy6FDipOHVz8Q0HrUGxdg1N1KBRBackiVoQ6FMVIuzQgpEpdjOiSLUXQIfK9976X37t3l6RNxVuS3Hvv7nPf3+/3vcvraTQaDdlFK4z3yMT8rh7d0Ww97QAzfX12wFq9br4buOk7UpicaQm5F4toCajh9LKnLm23Bex0Ee3k7ArwS/mVvH5elqEzzWmGr0dhDwGGFs3ouMAdA7491y+Dhw5KZuG9UEEA1r6XZfhUPOxgQ0pzPQJIDTi11NtOKOkKkHCcpfDrjQlxaXnGdFE1fAcg2to7sWmgAfVYWCzbPwO06imNHt0Tyd/IyfDlrYRy7kI3fvyUsyvRPbsCxIPIGQ6MAdFWD5RbKnjxZhTSWn0+AqyuS2agEPWNjZhPjrUngBgQkABDQ3hNOJdnmvkXa5UZ6W2CxXBaRoBiLLR2cLgnUSRIbOSLlptVx8LQk7k5iHutah44Pks12+VfApBVh04YsAbV1yR7sslYXU+oSPUK46NWZWPmseJdATLfTJ5UJsxYBNXqoc+EeX7RgpbmRmX1pcjsSq95VkP5AM1czMl63ViS27iNen2QYSUoH+bWVq1WpTh5OAFp1ekbtz7JRVJBPH/+Sk6O5i4YQCxc57Sbq0i1loA2R6hKfDho7rFLqZWzYvXiqCKgSi/6LSC+o7l2ZCIWz5UChHqfH2alvPVVRp/sT4Q7P/1NstmssZ6okNKAyD803+5BICjohjm90qgnAajhcNEHiP7BgQHZqFQkK49FF40uDtyHrZAKEQ6/NWDIoAkcBAQcmpuHoZWG+l1IwlHBjgGp3rP1zchi4kpG3vi+7wQUkMgz5p8tKIwdnzHbhtiatALTRcLvtBnmmc/ANQCuo3JxLGMF6+tmHFUULqgJsUl6Bwy/jXr1elQUWlGnj37JyfQksBhWL/tpM/itK9kHanOQ3rd47bcZxxSIkl97ow67u2Lfouh/+l6EnIvXuU5/TNkMAAjnA7RhUf9RQkWkTRhh9TUCuuO6kUooCMBc/xHzzLG71ZYJjAUhPD6TDUERxoXTC7CRiqOXAIRBZ/J5e3/oXxvhdE6FqpA2g+sslFaA3iLRMmvfYz6l8ixWD/3adF0bwXUNiN87gcP9qfOg72jkepVWkIC6ELQZu5BdAWIwbSl6F9AWQEAXRB8GtOpaxa4BCan3Tp3cemJ3G9R+R/g9DbGenDtLCJQVHIL0AeqKb7fFkaWjdzMIrz4+afdvpWKoslks+Lx9YltufQy/hPICUj1OQAOHR9KGeABwAfk6xOeFOmdrxaI5c6Ktffgjs5/4VzV6QRVUkKcafRMHQh8hQ9udPrm4ChJQw7n3EJYp4D0PPl3YlKtjx+0K3UEAiZ3G9T3fATWRd5UJ8cEBCm3o9D47Fc8CKUCEEw/om/kUD7H4zY2e+Vh8UJb8/fTrDt+BA8/rfZ/j63m9gLSYUHL7Ks99ndZpdYZew3Fub4hbVd3/uvYXfqiMwjPten8AAAAASUVORK5CYII=';
        return db.putAttachment('map', 'image', attachment, 'image/png');
      });
    });
  }
});

test('an existing map is displayed and can be updated', (assert) => {
  page.visit();
  page.visitMap();

  let existingSrc, newSrc;

  andThen(() => {
    existingSrc = mapPage.imageSrc;
    assert.ok(existingSrc.indexOf('blob') > -1, 'expected img src to have a blob URL');

    mapPage.setMap('R0lGODlhDwAPAKECAAAAzMzM/////wAAACwAAAAADwAPAAACIISPeQHsrZ5ModrLlN48CXF8m2iQ3YmmKqVlRtW4MLwWACH+H09wdGltaXplZCBieSBVbGVhZCBTbWFydFNhdmVyIQAAOw==');
  });

  andThen(() => {
    newSrc = mapPage.imageSrc;
    assert.ok(newSrc.indexOf('blob') > -1, 'expected new img src to have a blob URL');
    assert.ok(existingSrc !== newSrc, 'expected img src to have changed');
  });
});
