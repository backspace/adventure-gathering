import classic from 'ember-classic-decorator';
import Component from '@ember/component';

@classic
export default class DraggableNumber extends Component {
  didInsertElement() {
    super.didInsertElement();

    // FIXME restore…? but this would be a modifier now ya
    // $(this.element).find('input').draggableNumber();
  }
}
