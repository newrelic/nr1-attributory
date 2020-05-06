import React from 'react';
import PropTypes from 'prop-types';

import Attribute from './attribute';

export default class Event extends React.Component {
  static propTypes = {
    event: PropTypes.string,
    show: PropTypes.bool,
    attributes: PropTypes.array,
    searchText: PropTypes.string,
    editHandler: PropTypes.func
  };

  state = {};

  editClicked = attr => {
    const { event, editHandler } = this.props;
    if (editHandler) editHandler(event, attr);
  };

  render() {
    const { event, show, attributes, searchText } = this.props;

    return show ? (
      <div>
        <div className="event-name">{event}</div>
        {attributes.length < 1 && (
          <div className="attribs-info">
            No attribute(s) found for this event!
          </div>
        )}
        <div className="masonry">
          {attributes.map((a, i) => (
            <Attribute
              attribute={a}
              searchText={searchText}
              editHandler={this.editClicked}
              key={event + i}
            />
          ))}
        </div>
      </div>
    ) : null;
  }
}
