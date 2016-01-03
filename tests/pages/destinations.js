import PageObject from '../page-object';

const { clickable, collection, fillable, selectable, text, value, visitable } = PageObject;

export default PageObject.create({
  visit: visitable('/destinations'),

  destinations: collection({
    itemScope: '.destination',

    item: {
      description: text('.description'),
      awesomeness: text('.awesomeness'),
      risk: text('.risk'),

      edit: clickable('.edit')
    }
  }),

  new: clickable('.new'),

  descriptionField: {
    scope: 'textarea.description',
    value: value(),
    fill: fillable()
  },

  accessibilityField: {
    scope: 'textarea.accessibility',
    value: value(),
    fill: fillable()
  },

  awesomenessField: {
    scope: 'input.awesomeness',
    value: value(),
    fill: fillable()
  },

  riskField: {
    scope: 'input.risk',
    value: value(),
    fill: fillable()
  },

  answerField: {
    scope: 'input.answer',
    value: value(),
    fill: fillable()
  },

  regionField: {
    scope: 'select.region',
    value: value(),
    select: selectable()
  },

  save: clickable('.save'),
  cancel: clickable('.cancel'),
  delete: clickable('.delete')
});
