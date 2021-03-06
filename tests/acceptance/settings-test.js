import { run } from '@ember/runloop';
import { test } from 'qunit';

import moduleForAcceptance from 'adventure-gathering/tests/helpers/module-for-acceptance';

import page from '../pages/settings';

moduleForAcceptance('Acceptance | settings', {
  beforeEach() {
    this.store = this.application.__container__.lookup('service:store');
  }
});

test('a new settings document can be created and saved', function(assert) {
  const done = assert.async();

  page.visit();

  andThen(() => {
    assert.equal(page.goalField.value, '');
    assert.notOk(page.destinationStatus.isChecked);
  });

  page.goalField.fill('abc');
  page.clandestineRendezvous.click();
  page.txtbeyond.click();
  page.save();

  andThen(() => {
    this.store.findRecord('settings', 'settings').then(settings => {
      assert.equal(settings.get('goal'), 'abc');
      assert.ok(settings.get('clandestineRendezvous'));
      assert.ok(settings.get('txtbeyond'));
      done();
    });
  });
});

moduleForAcceptance('Acceptance | settings', {
  beforeEach(assert) {
    this.store = this.application.__container__.lookup('service:store');
    const done = assert.async();

    run(() => {
      const settings = this.store.createRecord('settings', {
        id: 'settings',
        goal: '12345',
        destinationStatus: true
      });

      settings.save().then(() => {
        done();
      });
    });
  }
});

test('an existing settings document is displayed and can be updated, with its boolean flags mirrored to the features service', function(assert) {
  const done = assert.async();

  page.visit();

  andThen(() => {
    const featuresService = this.application.__container__.lookup('service:features');
    assert.ok(featuresService.get('destinationStatus'));

    assert.equal(page.goalField.value, '12345');
    assert.ok(page.destinationStatus.isChecked);
  });

  page.goalField.fill('789');
  page.destinationStatus.click();
  page.clandestineRendezvous.click();
  page.txtbeyond.click();
  page.save();

  andThen(() => {
    this.store.findRecord('settings', 'settings').then(settings => {
      const featuresService = this.application.__container__.lookup('service:features');
      assert.notOk(featuresService.get('destinationStatus'));
      assert.ok(featuresService.get('clandestineRendezvous'));
      assert.ok(featuresService.get('txtbeyond'));

      assert.equal(settings.get('goal'), '789');
      assert.notOk(settings.get('destinationStatus'));

      done();
    });
  });
});
