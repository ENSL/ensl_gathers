import React from "react";
import ReactDOM from "react-dom";
import { array, object } from "prop-types";
import ReactEmoji from "react-emoji";
import ReactAutolink from "react-autolink";



class MessageBrowser extends React.Component {
  state = {
    browserState: "",
    messages: [],
    page: 0,
    limit: 250,
    search: ""
  }


  handleNextPage = (e) => {
    e.preventDefault();
    const page = this.state.page;
    this.setState({ page: page + 1 });
    this.loadMessages();
  }

  handlePreviousPage = (e) => {
    e.preventDefault();
    const page = this.state.page;
    if (page < 1) return;
    this.setState({ page: page - 1 });
    this.loadMessages();
  }

  pageHandlers = () => {
    let previous;
    if (this.state.page > 0) {
      previous = (
        <a className="btn btn-xs btn-primary add-right"
          onClick={this.handlePreviousPage}>Prev</a>
      );
    }
    let next;
    if (this.state.messages.length === this.state.limit) {
      next = (
        <a className="btn btn-xs btn-primary"
          onClick={this.handleNextPage}>Next</a>
      );
    }
    return (
      <div>
        {previous}
        <span className="add-right">
          {this.state.page}
        </span>
        {next}
      </div>
    );
  }

  loadMessages = () => {
    const limit = this.state.limit;
    const page = this.state.page;
    let data = {
      limit: limit,
      page: page
    };

    if (this.state.search.length) {
      data.query = this.state.search;
    }

    this.setState({ browserState: "Retrieving messages" });
    $.ajax({
      url: "/api/messages",
      data: data
    })
      .done(data => {
        this.setState({
          messages: data.messages,
          browserState: ""
        });
      })
      .fail(error => {
        console.error(error);
        this.setState({
          browserState: `Unable to retrieve messages.`
        });
      })
  }

  componentDidMount = () => {
    this.loadMessages();
  }

  updateLimit = (e) => {
    let newLimit = parseInt(e.target.value, 10);
    if (isNaN(newLimit) || newLimit > 250) newLimit = 250;
    this.setState({ limit: newLimit });
  }

  updateSearch = (e) => {
    this.setState({ search: e.target.value });
  }

  render = () => {
    let browserState;
    if (this.state.browserState.length) {
      browserState = (
        <div className="col-xs-7">
          <div className="well">{this.state.browserState}</div>
        </div>
      );
    }
    const messages = this.state.messages.map(message => {
      return (
        <tr key={message._id}>
          <td className="col-xs-2">{(new Date(message.createdAt)).toString()}</td>
          <td className="col-xs-3">{message.author.username}</td>
          <td className="col-xs-5">{message.content}</td>
          <td className="col-xs-2">{message._id}</td>
        </tr>
      );
    });
    return (
      <div className="row">
        <div className="col-xs-5">
          <div className="form-horizontal">
            <div className="form-group">
              <label className="col-sm-3 control-label">Max Results</label>
              <div className="col-sm-9">
                <input type="number" className="form-control"
                  onChange={this.updateLimit}
                  value={this.state.limit}></input>
              </div>
            </div>
            <div className="form-group">
              <label className="col-sm-3 control-label">Search Filter</label>
              <div className="col-sm-9">
                <input type="text" className="form-control"
                  onChange={this.updateSearch}
                  value={this.state.search}></input>
              </div>
            </div>
            <div className="form-group">
              <div className="col-sm-offset-3 col-sm-9">
                <button
                  className="btn btn-primary"
                  onClick={this.loadMessages}>Search</button>
              </div>
            </div>
            <div className="row">
              <div className="col-sm-offset-3 col-sm-9">
                <p>Page Control</p>
                {this.pageHandlers()}
              </div>
            </div>
          </div>
        </div>
        {browserState}
        <div className="col-xs-12">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Author</th>
                <th>Message</th>
                <th>ID</th>
              </tr>
            </thead>
            <tbody>
              {messages}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

class Chatroom extends React.Component {
  static propTypes = {
    messages: array.isRequired,
    socket: object.isRequired,
    user: object.isRequired
  }
  state = {
    autoScroll: true
  }

  componentDidMount = () => {
    let self = this;

    this.scrollListener = _.debounce((event) => {
      self.temporarilyDisableAutoScroll(event);
    }, 300, {
      leading: false,
      trailing: true
    });

    let node = ReactDOM.findDOMNode(this.refs.messageContainer);
    node.addEventListener('scroll', this.scrollListener);

    $(window).on("load", this.scrollToBottom);
  }

  componentWillUnmount = () => {
    node.removeEventListener('scroll', this.scrollListener);
    clearTimeout(this.disableScrollTimer);
  }

  loadMoreMessages = () => {
    const earliestMessage = this.props.messages[0];
    if (earliestMessage === undefined) return;
    this.props.socket.emit("message:refresh", {
      before: earliestMessage.createdAt
    });
  }

  sendMessage = (message) => {
    this.props.socket.emit("newMessage", { message: message });
  }

  clearAutoScrollTimeout = () => {
    if (this.disableScrollTimer) clearTimeout(this.disableScrollTimer);
  }

  temporarilyDisableAutoScroll = (event) => {
    let self = this;
    let node = event.target;
    if (node) {
      if (node.scrollHeight - node.scrollTop === node.clientHeight) {
        this.setState({ autoScroll: true });
        this.clearAutoScrollTimeout();
      }
      if (node.scrollHeight - node.scrollTop - node.clientHeight < 50) return;
    }
    this.setState({ autoScroll: false });
    this.clearAutoScrollTimeout();
    this.disableScrollTimer = setTimeout(() => {
      self.setState({
        autoScroll: true
      })
    }, 10000);
  }

  componentDidUpdate = (prevProps) => {
    if (prevProps.messages.length < this.props.messages.length) {
      this.scrollToBottom();
    }
  }

  scrollToBottom = () => {
    if (!this.state.autoScroll) return;
    let node = ReactDOM.findDOMNode(this.refs.messageContainer);
    node.scrollTop = node.scrollHeight;
  }

  render = () => {
    const socket = this.props.socket;
    const messages = this.props.messages.map(message => {
      if (message) {
        return <ChatMessage message={message}
          key={message._id}
          socket={socket}
          user={this.props.user} />
      }
    });
    return (
      <div>
        <ul className="chat" id="chatmessages" ref="messageContainer"
          style={{ height: this.props.containerHeight - 170 }}>
          <li className="text-center ">
            <a href="#"
              onClick={this.loadMoreMessages}
              className="btn btn-primary btn-xs">
              Load more messages
						</a>
          </li>
          {messages}
        </ul>
        <div>
          <MessageBar socket={socket} />
        </div>
      </div>
    );
  }
}

const imgurRegex = /^(https?:\/\/i\.imgur\.com\/\S*\.(jpg|png))$/i;

class ChatMessage extends React.Component {
  static propTypes = {
    user: object.isRequired,
    socket: object.isRequired,
    message: object.isRequired
  }

  state = {
    createdAt: ""
  }

  autolink = ReactAutolink.autolink
  emojify = ReactEmoji.emojify

  messageContent = () => {
    let self = this;
    let message = self.props.message.content
    if (message.match(imgurRegex)) {
      return (
        <div className="imgur-container">
          <a href={message} target="_blank">
            <img className="imgur-chat" src={message} />
          </a>
        </div>
      );
    }

    return (
      <p className="wordwrap">
        {
          self.autolink(message, {
            target: "_blank",
            rel: "nofollow"
          }).map((elem) => {
            if (_.isString(elem)) {
              return self.emojify(elem);
            } else {
              return elem;
            }
          })
        }
      </p>
    );
  }

  messageTime = () => {
    let self = this;
    let ts = new Date(self.props.message.createdAt);
    let t = ts.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    let d = ts.toLocaleDateString(undefined, { month: "2-digit", day: "2-digit" });
    let r = "";
    return r.concat(d, " ", t);
  }

  render = () => {
    let deleteButton;
    let user = this.props.user;
    if (user && user.admin) {
      deleteButton = <DeleteMessageButton messageId={this.props.message._id}
        socket={this.props.socket} />;
    }
    return (
      <li className="left clearfix chat-message list-unstyled">
        <span className="chat-img pull-left">
          <img
            src={this.props.message.author.avatar}
            className="chat-avatar" />
        </span>
        <div className="chat-body clearfix">
          <div className="header">
            <strong className="primary-font">
              {this.props.message.author.username}
            </strong>
            <small className="pull-right text-muted">
              <span className="hidden-xs">
                {this.messageTime()}
              </span>
              {deleteButton}
            </small>
          </div>
          {this.messageContent()}
        </div>
      </li>
    );
  }
}

class DeleteMessageButton extends React.Component {
  static propTypes = {
    socket: object.isRequired
  }

  handleClick = (e) => {
    e.preventDefault();
    this.props.socket.emit("message:delete", {
      id: this.props.messageId
    });
  }

  render = () => {
    return (
      <a href="#" onClick={this.handleClick}>
        <i className="fa fa-trash-o"></i>
      </a>
    );
  }
}

class MessageBar extends React.Component {
  static propTypes = {
    socket: object.isRequired
  }

  state = {
    statusMessage: null
  }


  sendMessage = (content) => {
    this.props.socket.emit("message:new", {
      content: content
    });
  }

  checkInputLength = () => {
    const input = ReactDOM.findDOMNode(this.refs.content).value;
    const currentStatusMessage = this.state.statusMessage;
    if (input.length > 256) {
      return this.setState({
        statusMessage: "Maximum of 256 characters will be saved"
      })
    }
    if (currentStatusMessage !== null) {
      this.setState({
        statusMessage: null
      });
    }
  }

  handleInputChange() {
    // Noop, later assigned as debounced method in componentWillMount
  }

  handleSubmit = (e) => {
    e.preventDefault();
    let content = ReactDOM.findDOMNode(this.refs.content).value.trim();
    if (!content) return;
    ReactDOM.findDOMNode(this.refs.content).value = '';
    this.sendMessage(content);
    return;
  }

  componentWillMount = () => {
    this.handleInputChange = _.debounce(this.checkInputLength, {
      leading: false,
      trailing: true
    });
  }

  render = () => {
    let statusMessage;
    if (this.state.statusMessage !== null) {
      statusMessage = <div className="input-group">
        <small>{this.state.statusMessage}</small>
      </div>;
    }
    return (

      <form onSubmit={this.handleSubmit} autoComplete="off">
        <div className="input-group">
          <input
            id="message-input"
            type="text"
            className="form-control message-input"
            ref="content"
            onChange={this.handleInputChange}
            autoComplete="off"
            placeholder="Be polite please..." />
          <span className="input-group-btn">
            <input
              type="submit"
              className="btn btn-primary"
              id="btn-chat"
              value="Send" />
          </span>
        </div>
        {statusMessage}
      </form>
    );
  }
}

export { Chatroom }
