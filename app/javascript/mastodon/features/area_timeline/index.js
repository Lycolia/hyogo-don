import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import AreaStatusListContainer from '../ui/containers/area_status_list_container';
import Column from '../../components/column';
import ColumnHeader from '../../components/column_header';
import {
  expandAreaTimeline,
} from '../../actions/timelines';
import { addColumn, removeColumn, moveColumn } from '../../actions/columns';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import ColumnSettingsContainer from './containers/column_settings_container';
import { connectAreaStream } from '../../actions/streaming';

const messages = defineMessages({
  title: { id: 'column.area', defaultMessage: 'Area timeline' },
});

const mapStateToProps = state => ({
  hasUnread: state.getIn(['timelines', `area:${state.getIn(['settings', 'area', 'area', 'body'])}`, 'unread']) > 0,
  streamingAPIBaseURL: state.getIn(['meta', 'streaming_api_base_url']),
  accessToken: state.getIn(['meta', 'access_token']),
});

@connect(mapStateToProps)
@injectIntl
export default class AreaTimeline extends React.PureComponent {

  static propTypes = {
    params: PropTypes.object.isRequired,
    columnId: PropTypes.string,
    dispatch: PropTypes.func.isRequired,
    streamingAPIBaseURL: PropTypes.string.isRequired,
    accessToken: PropTypes.string.isRequired,
    hasUnread: PropTypes.bool,
    multiColumn: PropTypes.bool,
    intl: PropTypes.object.isRequired,
  };

  handlePin = () => {
    const { columnId, dispatch } = this.props;

    if (columnId) {
      dispatch(removeColumn(columnId));
    } else {
      dispatch(addColumn('AREA', { id: this.props.params.id }));
    }
  }

  handleMove = (dir) => {
    const { columnId, dispatch } = this.props;
    dispatch(moveColumn(columnId, dir));
  }

  handleHeaderClick = () => {
    this.column.scrollTop();
  }

  componentDidMount () {
    const { dispatch, streamingAPIBaseURL, accessToken } = this.props;
    const { id } = this.props.params;

    dispatch(expandAreaTimeline(id));
    this.disconnect = dispatch(connectAreaStream(id));
  }

  componentDidUpdate (prevProps) {
    if (prevProps.params.id !== this.props.params.id) {
      const { dispatch } = this.props;
      const { id } = this.props.params;

      this.disconnect();
      dispatch(expandAreaTimeline(id));
      this.disconnect = dispatch(connectAreaStream(id));
    }
  }

  componentWillUnmount () {
    if (this.disconnect) {
      this.disconnect();
      this.disconnect = null;
    }
  }

  setRef = c => {
    this.column = c;
  }

  handleLoadMore = maxId => {
    this.props.dispatch(expandAreaTimeline(this.props.params.id, { maxId }));
  }

  render () {
    const { intl, hasUnread, columnId, multiColumn } = this.props;
    const { id } = this.props.params;
    const pinned = !!columnId;
    var message = { id: 'column.area.timeline.' + id, defaultMessage: id };

    return (
      <Column ref={this.setRef}>
        <ColumnHeader
          icon='map-marker'
          active={hasUnread}
          title={intl.formatMessage(message)}
          onPin={this.handlePin}
          onMove={this.handleMove}
          onClick={this.handleHeaderClick}
          pinned={pinned}
          multiColumn={multiColumn}
        >
          <ColumnSettingsContainer />
        </ColumnHeader>

        <AreaStatusListContainer
          trackScroll={!pinned}
          scrollKey={`area_timeline-${columnId}`}
          timelineId={`area:${id}`}
          settingTimelineId='area'
          loadMore={this.handleLoadMore}
          emptyMessage={<FormattedMessage id='empty_column.area' defaultMessage='There is nothing in this area yet.' />}
        />
      </Column>
    );
  }

}
