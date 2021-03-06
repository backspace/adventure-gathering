import { inject as service } from '@ember/service';
import Controller from '@ember/controller';

export default Controller.extend({
  map: service(),

  actions: {
    saveAttachment(name, property, {target}) {
      const file = target.files[0];

      if (property) {
        this.set(property, URL.createObjectURL(file));
      }

      this.get('map').saveFile(file, name);
    }
  }
});
