import { visit } from '@ember/test-helpers';
import { run } from '@ember/runloop';

import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';

import stringify from 'json-stringify-safe';

import page from '../pages/sync';

module('Acceptance | sync', function(hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function(assert) {
    const store = this.application.__container__.lookup('service:store');
    const done = assert.async();

    run(() => {
      const fixture = store.createRecord('destination');

      fixture.set('description', 'Ina-Karekh');

      fixture.save().then(() => {
        done();
      });
    });
  });

  // I had these as separate tests but localStorage was bleeding through… ugh
  test('can sync with another database, syncs are remembered and can be returned to', async function(assert) {
    const done = assert.async();

    await visit('/');
    page.visit();

    page.enterDestination('sync-db').sync();

    const syncController = this.application.__container__.lookup('controller:sync');

    syncController.get('syncPromise').then(() => {
      assert.equal(page.push.read, '4');
      assert.equal(page.push.written, '4');
      assert.equal(page.push.writeFailures, '0');

      // FIXME the sync db is accumulating documents
      //assert.equal(page.pull().read(), '0');
      //assert.equal(page.pull().written(), '0');
      assert.equal(page.pull.writeFailures, '0');

      assert.equal(page.databases().count, 1);

      page.enterDestination('other-sync').sync();

      assert.equal(page.databases().count, 2);
      assert.equal(page.databases(0).name, 'sync-db');
      assert.equal(page.databases(1).name, 'other-sync');

      page.databases(0).click();

      assert.equal(page.destinationValue, 'sync-db');

      done();
    }).catch((error) => {
      assert.ok(false, 'expected no errors syncing');

      // FIXME had to add this because PhantomJS was timing out during this test;
      // the test PouchDB was full and producing errors. Should figure out how
      // to destroy the database next time this happens.
      // eslint-disable-next-line
      console.log(stringify(error));

      done();
    });
  });
});
