import { AssumeUserIdButton } from "javascripts/components/user";
import React from "react"
import { object, array, number, string, func } from "prop-types";

import { enslUrl, rankVotes, observatoryUrl as obsUrl } from "../helper"

class SelectPlayerButton extends React.Component {
  static propTypes = {
    socket: object.isRequired,
    gather: object.isRequired,
    gatherer: object.isRequired
  }

  selectPlayer = (e) => {
    e.preventDefault();
    this.props.socket.emit("gather:select", {
      type: this.props.gather.type,
      player: parseInt(e.target.value, 10)
    });
  }

  render = () => {
    let button;
    if (this.props.gatherer.leader) {
      button = <button
        className="btn btn-xs btn-default team-label"
        data-disabled="true">Leader</button>;
    } else if (this.props.gatherer.team !== "lobby") {
      button = <button
        data-disabled="true"
        className="btn btn-xs btn-default team-label">
        {_.capitalize(this.props.gatherer.team)}
      </button>;
    } else {
      button = <button
        onClick={this.selectPlayer}
        value={this.props.gatherer.id}
        className="btn btn-xs btn-primary team-label"> Select
      </button>;
    }
    return button;
  }
}

class GathererList extends React.Component {
  memberList = () => {
    const self = this;
    return this.props.gather.gatherers
      .filter(gatherer => gatherer.team === self.props.team)
      .sort(gatherer => { return gatherer.leader ? 1 : -1 });
  }

  render = () => {
    const extractGatherer = gatherer => {
      let image;
      if (gatherer.leader) {
        image = <i className="fa fa-star add-right"></i>;
      }
      return (
        <tr key={gatherer.id}>
          <td className="col-md-12">
            {image}{gatherer.user.username}
            <span className="pull-right">
              <LifeformIcons gatherer={gatherer} />
            </span>
          </td>
        </tr>
      );
    };
    const members = this.memberList()
      .map(extractGatherer);
    return (
      <table className="table">
        <tbody>
          {members}
        </tbody>
      </table>
    );
  }
}

class GatherTeams extends React.Component {
  render = () => {
    return (
      <div className="row add-top">
        <div className="col-sm-6">
          <div className="panel panel-primary panel-light-background team-marines">
            <div className="panel-heading">
              Marines
            </div>
            <GathererList gather={this.props.gather} team="marine" />
          </div>
        </div>
        <div className="col-sm-6">
          <div className="panel panel-primary panel-light-background team-aliens">
            <div className="panel-heading">
              Aliens
            </div>
            <GathererList gather={this.props.gather} team="alien" />
          </div>
        </div>
      </div>
    );
  }
}

class ElectionProgressBar extends React.Component {
  componentDidMount = () => {
    const self = this;
    this.timer = setInterval(() => {
      self.forceUpdate();
    }, 900);
  }

  progress = () => {
    const interval = this.props.gather.election.interval;
    const startTime = (new Date(this.props.gather.election.startTime)).getTime();
    const msTranspired = Math.floor((new Date()).getTime() - startTime);

    return {
      num: msTranspired,
      den: interval,
      barMessage: Math.floor((interval - msTranspired) / 1000) + "s remaining"
    }
  }

  componentWillUnmount = () => {
    clearInterval(this.timer);
  }

  render() {
    return (<ProgressBar progress={this.progress()} />);
  }
}

class ProgressBar extends React.Component {
  render = () => {
    const progress = this.props.progress;
    const style = {
      width: Math.round((progress.num / progress.den * 100)) + "%"
    };
    const barMessage = progress.barMessage || "";
    return (
      <div className="progress">
        <div className="progress-bar progress-bar-striped active"
          data-role="progressbar"
          data-aria-valuenow={progress.num}
          data-aria-valuemin="0"
          data-aria-valuemax={progress.den}
          style={style}>{barMessage}
        </div>
      </div>
    );
  }
}

class GatherProgress extends React.Component {
  stateDescription = () => {
    switch (this.props.gather.state) {
      case "gathering":
        return "Waiting for more gatherers.";
      case "election":
        return "Currently voting for team leaders.";
      case "selection":
        return "Waiting for leaders to pick teams.";
      case "done":
        return "Gather completed.";
      default:
        return "Initialising gather.";
    }
  }

  gatheringProgress = () => {
    const gather = this.props.gather;
    const num = gather.gatherers.length;
    const den = gather.teamSize * 2;
    const remaining = den - num;
    const message = (remaining === 1) ?
      "Waiting for last player" : `Waiting for ${remaining} more players`;
    return {
      num: num,
      den: den,
      message: message
    };
  }

  electionProgress = () => {
    const gather = this.props.gather;
    const num = gather.gatherers.reduce((acc, gatherer) => {
      if (gatherer.leaderVote) acc++;
      return acc;
    }, 0);
    const den = gather.teamSize * 2;
    return {
      num: num,
      den: den,
      message: den - num + " more votes required"
    };
  }

  selectionProgress = () => {
    const gather = this.props.gather;
    const num = gather.gatherers.reduce((acc, gatherer) => {
      if (gatherer.team !== "lobby") acc++;
      return acc;
    }, 0);
    const den = gather.teamSize * 2;

    return {
      num: num,
      den: den,
      message: `${num} out of ${den} players assigned. Waiting
				on ${_.capitalize(gather.pickingTurn)}s to pick next...`
    };
  }

  render = () => {
    let progress, progressBar;
    const gatherState = this.props.gather.state;
    if (gatherState === 'gathering' && this.props.gather.gatherers.length) {
      progress = this.gatheringProgress();
      progressBar = (<ProgressBar progress={progress} />);
    } else if (gatherState === 'election') {
      progress = this.electionProgress();
      progressBar = (<ElectionProgressBar {...this.props} progress={progress} />);
    } else if (gatherState === 'selection') {
      progress = this.selectionProgress();
      progressBar = (<ProgressBar progress={progress} />);
    }

    if (!progress) return false;

    return (
      <div className="no-bottom">
        <p><strong>{this.stateDescription()}</strong> {progress.message}</p>
        {progressBar}
      </div>
    );
  }
}

class JoinGatherButton extends React.Component {
  static propTypes = {
    thisGatherer: object,
    user: object.isRequired,
    socket: object.isRequired,
    gather: object.isRequired
  }

  componentDidMount = () => {
    const self = this;
    this.timer = setInterval(() => {
      self.forceUpdate();
    }, 30000);
  }

  componentWillUnmount = () => {
    clearInterval(this.timer);
  }

  joinGather = (e) => {
    e.preventDefault();
    this.props.socket.emit("gather:join", {
      type: this.props.gather.type
    });
  }

  leaveGather = (e) => {
    e.preventDefault();
    this.props.socket.emit("gather:leave", {
      type: this.props.gather.type
    });
  }

  cooldownTime = () => {
    let user = this.props.user;
    if (!user) return false;
    let cooloffTime = this.props.gather.cooldown[user.id];
    if (!cooloffTime) return false;
    let timeRemaining = new Date(cooloffTime) - new Date();
    return timeRemaining > 0 ? timeRemaining : false;
  }

  render = () => {
    let gather = this.props.gather;
    let thisGatherer = this.props.thisGatherer;
    if (thisGatherer) {
      return <button
        onClick={this.leaveGather}
        className="btn btn-danger">Leave Gather</button>;
    }
    if (gather.state === 'gathering') {
      let cooldownTime = this.cooldownTime();
      if (cooldownTime) {
        return <CooloffButton timeRemaining={cooldownTime} />;
      } else {
        return <button
          onClick={this.joinGather}
          className="btn btn-success">Join Gather</button>;
      }
    }
    return false;
  }
}

class CooloffButton extends React.Component {
  static propTypes = {
    timeRemaining: number.isRequired
  }

  timeRemaining = () => {
    return `${Math.floor(this.props.timeRemaining / 60000) + 1} minutes remaining`;
  }

  render = () => {
    return <button
      disabled="true"
      className="btn btn-success">
      Leaver Cooloff ({this.timeRemaining()})
    </button>
  }
}

class GatherActions extends React.Component {
  static propTypes = {
    socket: object.isRequired,
    gather: object.isRequired,
    thisGatherer: object
  }

  voteRegather = (e) => {
    e.preventDefault(e);
    this.props.socket.emit("gather:vote", {
      type: this.props.gather.type,
      regather: (e.target.value === "true")
    });
  }

  regatherVotes = () => {
    let gather = this.props.gather;
    if (!gather) return 0;
    return gather.gatherers.reduce((acc, gatherer) => {
      if (gatherer.regatherVote) acc++;
      return acc;
    }, 0);
  }

  render = () => {
    let regatherButton;
    let pickPatternIndicator;
    const user = this.props.user;
    const gather = this.props.gather;
    const socket = this.props.socket;
    const thisGatherer = this.props.thisGatherer;
    let pickIndex = this.props.gather.pickingTurnIndex - 1;
    if (thisGatherer) {
      let regatherVotes = this.regatherVotes();
      if (thisGatherer.regatherVote) {
        regatherButton = <button value="false" onClick={this.voteRegather}
          className="btn btn-danger">
          {`Voted Regather (${regatherVotes}/8)`}
        </button>;
      } else {
        regatherButton = <button value="true" onClick={this.voteRegather}
          className="btn btn-danger">
          {`Vote Regather (${regatherVotes}/8)`}
        </button>;
      }

      pickPatternIndicator = <ul className="list-inline">
        {gather.pickingPattern.map((team, index) => {
          if (team === 'alien') {
            if (index <= pickIndex) {
              return <li key={index} className="padding-y-1"><div className="pick-pattern-box alien-box-active"></div></li>
            } else {
              return <li key={index} className="padding-y-1"><div className="pick-pattern-box alien-box"></div></li>
            }
          } else {
            if (index <= pickIndex) {
              return <li key={index} className="padding-y-1"><div className="pick-pattern-box marine-box-active"></div></li>
            } else {
              return <li key={index} className="padding-y-1"><div className="pick-pattern-box marine-box"></div></li>
            }
          }
        })}
      </ul>;
    }

    return (
      <div>
        <div className="text-right">
          <ul className="list-inline no-bottom content-center">
            <li key="picking">
              {pickPatternIndicator}
            </li>
            <ul className='list-inline no-bottom'>
              <li key="join" className='padding-right-0'>
                <JoinGatherButton gather={gather} thisGatherer={thisGatherer}
                  user={user} socket={socket} />
              </li>
              <li key="regather" className='padding-right-0'>
                {regatherButton}
              </li>
            </ul>
          </ul>
        </div>
      </div>
    );
  }
}

class VoteButton extends React.Component {
  static propTypes = {
    socket: object.isRequired,
    candidate: object.isRequired,
    thisGatherer: object,
    gather: object.isRequired
  }

  cancelVote = (e) => {
    this.props.socket.emit("gather:vote", {
      type: this.props.gather.type,
      leader: {
        candidate: null
      }
    });
  }

  vote = (e) => {
    e.preventDefault();
    this.props.socket.emit("gather:vote", {
      type: this.props.gather.type,
      leader: {
        candidate: parseInt(e.target.value, 10)
      }
    });
  }

  stopGatherMusic = () => {
    soundController.stop();
  }

  render = () => {
    let candidate = this.props.candidate;
    let thisGatherer = this.props.thisGatherer;
    if (thisGatherer === null) {
      return false;
    }
    if (thisGatherer.leaderVote === candidate.id) {
      return (
        <button
          onClick={this.cancelVote}
          className="btn btn-xs btn-success vote-button">Voted
        </button>
      );
    } else {
      return (
        <button
          onClick={this.vote}
          className="btn btn-xs btn-primary vote-button"
          value={candidate.id}>Vote
        </button>
      );
    }
  }
}

class ServerVoting extends React.Component {
  static propTypes = {
    socket: object.isRequired,
    gather: object.isRequired,
    thisGatherer: object,
  }

  voteHandler = (serverId) => {
    return e => {
      e.preventDefault();
      this.props.socket.emit("gather:vote", {
        type: this.props.gather.type,
        server: {
          id: serverId
        }
      });
    }
  }

  votesForServer = (server) => {
    return this.props.gather.gatherers.reduce((acc, gatherer) => {
      if (gatherer.serverVote.some(voteId => voteId === server.id)) acc++;
      return acc;
    }, 0);
  }

  render = () => {
    let self = this;
    let thisGatherer = self.props.thisGatherer;
    let servers = self.props.gather.servers.sort((a, b) => {
      const aVotes = self.votesForServer(a);
      const bVotes = self.votesForServer(b);
      return bVotes - aVotes;
    }).map(server => {
      let votes = self.votesForServer(server);
      let style = thisGatherer.serverVote.some(voteId => voteId === server.id) ?
        "list-group-item list-group-item-success" : "list-group-item";
      return (
        <a href="#"
          className={style}
          onClick={self.voteHandler(server.id)}
          key={server.id}>
          <span className="badge">{votes}</span>
          {server.name || server.description}
        </a>
      );
    });

    let votes = thisGatherer.serverVote.length;

    return (
      <div className="panel panel-primary">
        <div className="panel-heading">
          {votes === 2 ? "Server Votes" :
            `Please Vote for a Server. ${2 - votes} votes remaining`}
        </div>
        <div className="list-group gather-voting">
          {servers}
        </div>
      </div>
    );
  }
}

class MapVoting extends React.Component {
  static propTypes = {
    socket: object.isRequired,
    gather: object.isRequired,
    thisGatherer: object,
    maps: array.isRequired,
  }

  voteHandler = (mapId) => {
    return e => {
      e.preventDefault();
      this.props.socket.emit("gather:vote", {
        type: this.props.gather.type,
        map: {
          id: mapId
        }
      });
    }
  }

  votesForMap = (map) => {
    return this.props.gather.gatherers.reduce((acc, gatherer) => {
      if (gatherer.mapVote.some(voteId => voteId === map.id)) acc++;
      return acc;
    }, 0);
  }

  render = () => {
    const self = this;
    let thisGatherer = self.props.thisGatherer
    let maps = self.props.maps.sort((a, b) => {
      const aVotes = self.votesForMap(a);
      const bVotes = self.votesForMap(b);
      return bVotes - aVotes;
    }).map(map => {
      let votes = self.votesForMap(map);
      let style = thisGatherer.mapVote.some(voteId => voteId === map.id) ?
        "list-group-item list-group-item-success" : "list-group-item";
      return (
        <a href="#"
          key={map.id}
          onClick={self.voteHandler(map.id)}
          className={style}>
          <span className="badge">{votes}</span>
          {map.name}
        </a>
      );
    });

    let votes = thisGatherer.mapVote.length;

    return (
      <div className="panel panel-primary">
        <div className="panel-heading">
          {votes === 2 ? "Map Votes" :
            `Please Vote for a Map. ${2 - votes} votes remaining`}
        </div>
        <div className="list-group gather-voting">
          {maps}
        </div>
      </div>
    );
  }
}

class Gather extends React.Component {
  static propTypes = {
    thisGatherer: object,
    maps: array.isRequired,
    socket: object.isRequired,
    gather: object.isRequired
  }

  render = () => {
    const socket = this.props.socket;
    const gather = this.props.gather;
    const thisGatherer = this.props.thisGatherer;
    const soundController = this.props.soundController;
    const maps = this.props.maps;
    const user = this.props.user;
    if (gather === null) return <div></div>;

    let voting;
    if (thisGatherer) {
      let state = gather.state;
      if (state === 'gathering' || state === 'election') {
        voting = (
          <div className="row add-top">
            <div className="col-sm-6">
              <MapVoting gather={gather} maps={maps}
                socket={socket} thisGatherer={thisGatherer} />
            </div>
            <div className="col-sm-6">
              <ServerVoting gather={gather}
                socket={socket} thisGatherer={thisGatherer} />
            </div>
          </div>
        );
      } else {
        voting = <GatherVotingResults gather={gather} maps={maps} />;
      }
    }

    let gatherTeams;
    if (gather.state === 'selection') {
      gatherTeams = <GatherTeams gather={gather} />;
    }

    if (gather.gatherers.length > 0) {
      return (
        <div>
          <div className="panel panel-primary add-bottom">
            <div className="panel-heading">{gather.name} ({gather.description})</div>
            <div className="panel-body">
              <GatherProgress gather={gather} />
              <GatherActions gather={gather} user={user} thisGatherer={thisGatherer}
                socket={socket} />
            </div>
          </div>
          <Gatherers gather={gather} user={user} thisGatherer={thisGatherer}
            socket={socket} soundController={soundController} />
          {gatherTeams}
          {voting}
        </div>
      );
    } else {
      return (
        <div>
          <div className="panel panel-primary add-bottom">
            <div className="panel-heading">{gather.name} ({gather.description})</div>
          </div>
          <Gatherers gather={gather} user={user} thisGatherer={thisGatherer}
            socket={socket} soundController={soundController} />
        </div>
      );
    }

  }
}

class LifeformIcons extends React.Component {
  availableLifeforms = () => {
    return ["skulk", "gorge", "lerk", "fade", "onos", "commander"];
  }

  gathererLifeforms = () => {
    let lifeforms = [];
    let gatherer = this.props.gatherer;
    let abilities = gatherer.user.profile.abilities;
    for (let attr in abilities) {
      if (abilities[attr]) lifeforms.push(_.capitalize(attr));
    }
    return lifeforms;
  }

  render = () => {
    let lifeforms = this.gathererLifeforms();
    let availableLifeforms = this.availableLifeforms();
    let icons = availableLifeforms.map(lifeform => {
      let containsAbility = lifeforms.some(gathererLifeform => {
        return gathererLifeform.toLowerCase() === lifeform.toLowerCase()
      });
      if (containsAbility) {
        return <img
          className="lifeform-icon"
          key={lifeform}
          src={`/${lifeform.toLowerCase()}.png`} />
      } else {
        return <img
          className="lifeform-icon"
          key={lifeform}
          src={`/blank.gif`} />
      }
    });
    return <span className="add-right hidden-xs">{icons}</span>
  }
}

class GatherMenu extends React.Component {
  static propTypes = {
    gatherPool: object.isRequired,
    currentGather: string.isRequired,
    gatherSelectedCallback: func.isRequired
  }

  onClick = (gather) => {
    return () => {
      this.props.gatherSelectedCallback(gather.type);
    }
  }

  itemClass = (gather) => {
    let className = ["treeview"];
    if (gather.type === this.props.currentGather) {
      className.push("active");
    }
    return className.join(" ");
  }

  gatherPoolArray = () => {
    const gatherArray = [];
    const gatherPool = this.props.gatherPool;
    for (let attr in gatherPool) {
      if (gatherPool.hasOwnProperty(attr)) {
        gatherArray.push(gatherPool[attr]);
      }
    }
    return gatherArray.sort((a, b) => a.name - b.name);
  }

  drawerItemsClass = (open) => {
    if (!open) {
      return 'drawerItems'
    }
  }

  render = () => {
    let open = !this.props.drawerState

    return (
      <ul className="sidebar-menu">
        <li className="header">Gather Formats</li>
        {
          this.gatherPoolArray().map(gather => {
            if (open) {
              return (
                <li className={this.itemClass(gather)}
                  key={gather.type}>
                  <a href="#" onClick={this.onClick(gather)}>
                    <strong>{gather.name + ' ' + '(' + gather.gatherers.length + '/' + gather.teamSize * 2 + ')'}</strong>
                    <br />
                    <small>{gather.description}</small>
                  </a>
                </li>
              );
            } else {
              return (
                <li className={this.itemClass(gather)}
                  key={gather.type}>
                  <a className='aOpened' href="#" onClick={this.onClick(gather)}>
                    <div className='drawerItemsIcon'><img className="gatherTypeIcons" src={gather.icon} /></div><p className='drawerItems'><strong>{gather.gatherers.length + '/' + gather.teamSize * 2}</strong></p>
                    <br />
                  </a>
                </li>
              );
            }
          })
        }
      </ul>
    );
  }
}

class GathererListItem extends React.Component {
  static propTypes = {
    user: object.isRequired,
    gather: object.isRequired,
    socket: object.isRequired,
    gatherer: object.isRequired,
    thisGatherer: object,
    soundController: object.isRequired
  }

  bootGatherer = (e) => {
    e.preventDefault();
    this.props.socket.emit("gather:leave", {
      type: this.props.gather.type,
      gatherer: parseInt(e.target.value, 10) || null
    });
  }

  state = {
    collapse: true
  };


  toggleCollapse = (e) => {
    e.preventDefault();
    this.setState({ collapse: !this.state.collapse });
  }

  caret = () => {
    if (this.state.collapse) {
      return <i className="fa fa-caret-down"></i>;
    } else {
      return <i className="fa fa-caret-up"></i>;
    }
  }

  collapseState = () => {
    return `panel-collapse out collapse ${this.state.collapse ? "" : "in"}`;
  }

  render = () => {
    const user = this.props.user;
    const gather = this.props.gather;
    const socket = this.props.socket;
    const gatherer = this.props.gatherer;
    const thisGatherer = this.props.thisGatherer;
    const soundController = this.props.soundController;

    let country;
    if (gatherer.user.country) {
      country = (
        <img src="/blank.gif"
          className={"flag flag-" + gatherer.user.country.toLowerCase()}
          alt={gatherer.user.country} />
      );
    };

    const skill = gatherer.user.profile.skill || "Not Available";

    const hiveStats = [];
    if (gatherer.user.hive.skill) hiveStats.push(`${gatherer.user.hive.skill} ELO`);

    if (gatherer.user.hive.playTime) {
      hiveStats.push(`${Math.floor(gatherer.user.hive.playTime / 3600)} Hours`);
    }

    const hive = (hiveStats.length) ? hiveStats.join(", ") : "Not Available";

    const team = (gatherer.user.team) ? gatherer.user.team.name : "None";

    let action;
    if (gather.state === "election") {
      let votes = gather.gatherers.reduce((acc, voter) => {
        if (voter.leaderVote === gatherer.id) acc++;
        return acc;
      }, 0)
      action = (
        <span>
          <span className="badge add-right">{votes + " votes"}</span>
          <VoteButton
            socket={socket}
            gather={gather}
            thisGatherer={thisGatherer}
            soundController={soundController}
            candidate={gatherer} />
        </span>
      );
    }

    if (gather.state === 'selection') {
      if (thisGatherer &&
        thisGatherer.leader &&
        thisGatherer.team === gather.pickingTurn) {
        action = (
          <span>
            <SelectPlayerButton gatherer={gatherer}
              gather={gather}
              socket={socket} />
          </span>
        );
      } else {
        if (gatherer.leader) {
          action = (<span className={`label label-padding
						label-${gatherer.team}
						team-label`}>Leader</span>);
        } else if (gatherer.team !== "lobby") {
          action = (<span className={`label label-padding
						label-${gatherer.team}
						team-label`}>{_.capitalize(gatherer.team)}</span>);
        } else {
          action = (<span className="label label-padding label-default team-label">
            Lobby</span>);
        }
      }
    }

    let adminOptions;
    if ((user && user.admin) || (user && user.moderator)) {
      adminOptions = [
        <hr key="line" />,
        <dt key="title">Admin</dt>,
        <dd key="adminmenu">
          <button
            className="btn btn-xs btn-danger"
            value={gatherer.user.id}
            onClick={this.bootGatherer}>
            Boot from Gather
          </button>&nbsp;
          <AssumeUserIdButton socket={socket}
            gatherer={gatherer} currentUser={user} />
        </dd>
      ]
    }

    const lastSeenInMinutes = (gatherer) => {
      const now = Date.now();
      const minutesSinceLastSeen = (now - gatherer.user.lastSeen) / 60000;

      if (minutesSinceLastSeen < 0) {
        return 0;
      }

      return parseInt(minutesSinceLastSeen || 0);
    };

    let idleStatus;
    if (!gatherer.user.online) {
      const mins = lastSeenInMinutes(gatherer);
      if (mins > 60) {
        const hours = Math.round(mins / 6) / 10;
        idleStatus = [
          <dt>Last Seen</dt>,
          <dd>{hours} hours ago</dd>
        ]
      } else {
        idleStatus = [
          <dt>Last Seen</dt>,
          <dd>{mins} mins ago</dd>
        ]
      }
    }

    let tabColor = gatherer.team !== "lobby" ? `panel-${gatherer.team}` : "panel-info";
    let onlineStatus = gatherer.user.online ? "" : "font-italic"
    return (
      <div className={`panel ${tabColor} gatherer-panel`}
        key={gatherer.user.id} data-userid={gatherer.user.id}>
        <div className="panel-heading">
          <h4 className="panel-title">
            {country} <span className={onlineStatus}>{gatherer.user.username}</span>
            <span className="pull-right">
              <a href="#" className="btn btn-xs btn-primary add-right"
                onClick={this.toggleCollapse}>
                Info {this.caret()}</a>
              <LifeformIcons gatherer={gatherer} />
              {action}
            </span>
          </h4>
        </div>
        <div id={gatherer.user.id.toString() + "-collapse"}
          className={this.collapseState()} >
          <div className="panel-body">
            <dl>
              {idleStatus}
              <dt>Skill Level</dt>
              <dd>{skill}</dd>
              <dt>Team</dt>
              <dd>{team}</dd>
              <dt>Hive Stats</dt>
              <dd>{hive}</dd>
              <dt>Links</dt>
              <dd>
                <a href={enslUrl(gatherer)}
                  className="btn btn-xs btn-primary"
                  target="_blank">ENSL Profile</a>&nbsp;
                <a href={obsUrl(gatherer)}
                  className="btn btn-xs btn-primary"
                  target="_blank">Observatory Profile</a>
              </dd>
              {adminOptions}
            </dl>
          </div>
        </div>
      </div>
    );
  }
}

class Gatherers extends React.Component {
  static propTypes = {
    user: object,
    thisGatherer: object,
    socket: object.isRequired,
    gather: object.isRequired,
    soundController: object.isRequired
  }

  joinGather = (e) => {
    e.preventDefault();
    this.props.socket.emit("gather:join", {
      type: this.props.gather.type
    });
  }

  render = () => {
    const self = this;
    const user = this.props.user;
    const socket = this.props.socket;
    const gather = this.props.gather;
    const thisGatherer = this.props.thisGatherer;
    const gatherers = gather.gatherers
      .sort((a, b) => {
        return (b.user.hive.skill || 1000) - (a.user.hive.skill || 1000);
      })
      .map(gatherer => {
        return <GathererListItem socket={socket} gatherer={gatherer} thisGatherer={thisGatherer}
          soundController={this.props.soundController} key={gatherer.id}
          user={user} gather={gather} />
      });

    if (gather.gatherers.length) {
      return (
        <div id="gatherers-panel">
          {gatherers}
        </div>
      );
    } else {
      return (
        <div className="panel panel-primary add-bottom">
          <div className="panel-body text-center join-hero">
            <button
              onClick={this.joinGather}
              className="btn btn-success btn-lg">Start Gather</button>
          </div>
        </div>
      );
    }
  }
}

class CompletedGather extends React.Component {
  completionDate = () => {
    let d = new Date(this.props.gather.done.time);
    if (d) {
      return d.toLocaleString();
    } else {
      return "Completed Gather"
    }
  }

  state = {
    show: !!this.props.show
  }

  toggleGatherInfo = () => {
    let newState = !this.state.show;
    this.setState({
      show: newState
    });
  }

  render = () => {
    let gatherInfo = [];
    let gather = this.props.gather;
    let maps = this.props.maps;
    let gatherName = gather.name || "Classic Gather";
    if (this.state.show) {
      gatherInfo.push(<GatherTeams gather={gather} key="gatherteams" />);
      gatherInfo.push(<GatherVotingResults gather={gather}
        maps={maps} key="gathervotingresults" />);
    }
    return (
      <div>
        <div className="panel panel-success add-bottom pointer"
          onClick={this.toggleGatherInfo}>
          <div className="panel-heading"><strong>{gatherName} - {this.completionDate()}</strong></div>
        </div>
        {gatherInfo}
      </div>
    );
  }
}

class GatherVotingResults extends React.Component {
  // Returns an array of ids voted for e.g. [1,2,5,1,1,3,2]
  countVotes = (voteType) => {
    return this.props.gather.gatherers.reduce((acc, gatherer) => {
      let votes = gatherer[voteType];

      // Temporary fix because some mapvotes are ints and not arrays
      if (!Array.isArray(votes)) votes = [votes];

      if (votes.length > 0) votes.forEach(vote => acc.push(vote));
      return acc;
    }, []);
  }

  selectedMaps = () => {
    return rankVotes(this.countVotes('mapVote'), this.props.maps).slice(0, 2)
  }

  selectedServers = () => {
    return rankVotes(this.countVotes('serverVote'), this.props.gather.servers || []).slice(0, 2);
  }

  serverTable = (server, primary) => {
    let password = server.password ? server.password : "N/A";
    let className = primary ? "btn btn-primary max-width" : "btn btn-primary pull-right";
    let label = primary ? `Join ${server.name}` : "Join Fallback"
    return (
      <div>
        <dl>
          <dt>Server Name</dt>
          <dd>{server.name}</dd>
          <dt>Address</dt>
          <dd>{server.ip}:{server.port}</dd>
          <dt>Password</dt>
          <dd>{password}</dd>
        </dl>
        <p>
          <a href={`steam://run/4920//+connect%20${server.ip}:${server.port}%20+password%20${server.password}`}
            className={className}>{label}</a>
        </p>
      </div>
    );
  }

  render = () => {
    let maps = this.selectedMaps();
    let servers = this.selectedServers();
    let mainServer;
    if (servers[0]) {
      mainServer = this.serverTable(servers[0], true);
    }

    let altServer;
    if (servers[1]) {
      altServer = this.serverTable(servers[1]);
    }
    return (
      <div className="panel panel-primary">
        <div className="panel-heading">
          Game Information
        </div>
        <div className="panel-body">
          <div className="row">
            <div className="col-md-4">
              <h4>Map Selection</h4>
              <dl>
                <dt>Maps</dt>
                <dd>{maps[0].name} <br />(Alternate: {maps[1].name})</dd>
              </dl>
            </div>
            <div className="col-md-4">
              <h4>Primary Server</h4>
              {mainServer}
            </div>
            <div className="col-md-4">
              <h4>Fallback Server</h4>
              {altServer}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export { Gather, CompletedGather, GatherMenu, LifeformIcons }
