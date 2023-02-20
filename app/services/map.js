import { getOwner } from '@ember/application';
import { computed } from '@ember/object';
import Service from '@ember/service';

import blobUtil from 'blob-util';
import classic from 'ember-classic-decorator';

@classic
export default class MapService extends Service {
  @computed
  get db() {
    return getOwner(this).lookup('adapter:application').get('db');
  }

  getAttachment(name) {
    return this.db.getAttachment('map', name);
  }

  getURL(name) {
    return this.getAttachment(name)
      .then((attachment) => {
        return URL.createObjectURL(attachment);
      })
      .catch(() => {
        return null;
      });
  }

  getArrayBuffer(name) {
    return this.getAttachment(name).then((attachment) => {
      return blobUtil.blobToArrayBuffer(attachment);
    });
  }

  getBase64String(name) {
    return this.getAttachment(name).then((attachment) => {
      return blobUtil.blobToBase64String(attachment);
    });
  }

  saveFile(file, name) {
    const db = this.db;

    db.get('map')
      .then((map) => {
        return db.putAttachment('map', name, map._rev, file, file.type);
      })
      .catch(() => {
        return db.putAttachment('map', name, file, file.type);
      });
  }
}
