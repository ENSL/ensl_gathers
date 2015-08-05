"use strict";

var UserLogin = React.createClass({
	authorizeId: function (id) {
		socket.emit("users:authorize", {
			id: parseInt(id, 10)
		});
		setTimeout(function () {
			socket.emit("gather:refresh");
		}, 5000);
	},
	handleSubmit: function (e) {
		e.preventDefault();
		var id = React.findDOMNode(this.refs.authorize_id).value.trim();
		if (!id) return;
		React.findDOMNode(this.refs.authorize_id).value = '';
		this.authorizeId(id);
	},
	render: function () {
		return (
			<form onSubmit={this.handleSubmit} >
				<div className="input-group signin">
					<input 
						id="btn-input" 
						type="text" 
						className="form-control" 
						ref="authorize_id"
						placeholder="Choose an ID..." />
					<span className="input-group-btn">
						<input 
							type="submit" 
							className="btn btn-primary" 
							id="btn-chat" 
							value="Login" />
					</span>
				</div>
				<div className="signin">
				<p className="text-center"><small>Just a temporary measure until genuine authentication is implemented</small></p>
				</div>
			</form>
		);
	}
})

var UserMenu = React.createClass({
	getDefaultProps: function () {
		return {
			users: []
		};
	},
	componentDidMount: function () {
		var self = this;
		socket.on('users:update', function (data) {
			self.setProps({
				users: data.users
			});
		});
	},
	render: function () {
		var users = this.props.users.map(function (user) {
			return (
				<li key={user.id}><a href="#">{user.username}</a></li>
			);
		});
		return (
			<ul className="nav" id="side-menu">
				<li>
					<a href="#">
						<i className="fa fa-users fa-fw"></i> Online 
						<span className="badge add-left"> {this.props.users.length} </span>
					</a>
				</li>
				{users}
				<li><br /><UserLogin /><br /></li>
			</ul>
		);
	}
});

var AdminPanel = React.createClass({
	handleGatherReset: function () {
		socket.emit("gather:reset");
	},
	render: function () {
		return (
			<ul className="nav" id="admin-menu">
				<li>
					<div className="admin-panel">
						<h5>Admin</h5>
						<button
							className="btn btn-danger max-width"
							onClick={this.handleGatherReset}>
							Reset Gather</button>
						<p className="text-center add-top"><small>Only responds for admins on staging.ensl.org</small></p>
					</div>
				</li>
			</ul>
		)
	}
});

var CurrentUser = React.createClass({
	componentDidMount: function () {
		var self = this;
		socket.on("users:update", function (data) {
			self.setProps({
				user: data.currentUser
			});
		});
		socket.emit("users:refresh");
	},
	render: function () {
		if (this.props.user) {
			return (
				<li class="dropdown">
					<a className="dropdown-toggle" data-toggle="dropdown" href="#">
						{this.props.user.username} &nbsp;<img src={this.props.user.avatar}
						alt="User Avatar" 
						height="20"
						width="20" /> <i className="fa fa-caret-down"></i>
					</a>
					<ul className="dropdown-menu dropdown-user">
						<li>
							<a href="#"><i className="fa fa-gear fa-fw"></i> Profile</a>
						</li>
						<li>
							<a href="#"><i className="fa fa-flag fa-fw"></i> Notifications</a>
						</li>
						<li>
							<a href="#"><i className="fa fa-music fa-fw"></i> Sounds</a>
						</li>
						<li>
						 	<a href="#" data-toggle="modal" data-target="#designmodal">Design Goals</a>
						</li>
						<li className="divider"></li>
							<li><a href="login.html"><i className="fa fa-sign-out fa-fw"></i> Logout</a>
						</li>
					</ul>
				</li>

			);
		} else {
			return false;
		}
	}
});