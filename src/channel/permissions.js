// @flow

import ChannelModule from './module';
import User from '../user';

const DEFAULT_PERMISSIONS = {
    seeplaylist: -1,          // See the playlist
    playlistadd: 1.5,         // Add video to the playlist
    playlistnext: 1.5,        // Add a video next on the playlist
    playlistmove: 1.5,        // Move a video on the playlist
    playlistdelete: 2,        // Delete a video from the playlist
    playlistjump: 1.5,        // Start a different video on the playlist
    playlistaddlist: 1.5,     // Add a list of videos to the playlist
    oplaylistadd: -1,         // Same as above, but for open (unlocked) playlist
    oplaylistnext: 1.5,
    oplaylistmove: 1.5,
    oplaylistdelete: 2,
    oplaylistjump: 1.5,
    oplaylistaddlist: 1.5,
    playlistaddcustom: 3,     // Add custom embed to the playlist
    playlistaddrawfile: 2,    // Add raw file to the playlist
    playlistaddlive: 1.5,     // Add a livestream to the playlist
    exceedmaxlength: 2,       // Add a video longer than the maximum length set
    addnontemp: 2,            // Add a permanent video to the playlist
    settemp: 2,               // Toggle temporary status of a playlist item
    playlistshuffle: 2,       // Shuffle the playlist
    playlistclear: 2,         // Clear the playlist
    pollctl: 1.5,             // Open/close polls
    pollvote: -1,             // Vote in polls
    viewhiddenpoll: 1.5,      // View results of hidden polls
    voteskip: -1,             // Vote to skip the current video
    viewvoteskip: 1.5,        // View voteskip results
    mute: 1.5,                // Mute other users
    kick: 1.5,                // Kick other users
    ban: 2,                   // Ban other users
    motdedit: 3,              // Edit the MOTD
    filteredit: 3,            // Control chat filters
    filterimport: 3,          // Import chat filter list
    emoteedit: 3,             // Control emotes
    emoteimport: 3,           // Import emote list
    playlistlock: 2,          // Lock/unlock the playlist
    leaderctl: 2,             // Give/take leader
    drink: 1.5,               // Use the /d command
    chat: 0,                  // Send chat messages
    chatclear: 2,             // Use the /clear command
    exceedmaxitems: 2         // Exceed maximum items per user limit
};

class PermissionsModule extends ChannelModule {
    permissions: any;
    openPlaylist: any;

    constructor(channel: any) {
        super(channel);
        this.permissions = {};
        this.openPlaylist = false;
    }

    load(data: any): void {
        this.permissions = {};
        var preset = "permissions" in data ? data.permissions : {};
        for (var key in DEFAULT_PERMISSIONS) {
            if (key in preset) {
                this.permissions[key] = preset[key];
            } else {
                this.permissions[key] = DEFAULT_PERMISSIONS[key];
            }
        }

        if ("openPlaylist" in data) {
            this.openPlaylist = data.openPlaylist;
        } else if ("playlistLock" in data) {
            this.openPlaylist = !data.playlistLock;
        }
    }

    save(data: any): void {
        data.permissions = this.permissions;
        data.openPlaylist = this.openPlaylist;
    }

    hasPermission(account: any, node: any): bool {
        if (account instanceof User) {
            account = account.account;
        }

        if (node.indexOf("playlist") === 0 && this.openPlaylist &&
            account.effectiveRank >= this.permissions["o"+node]) {
            return true;
        }

        return account.effectiveRank >= this.permissions[node];
    }

    sendPermissions(users: any): void {
        var perms = this.permissions;
        if (users === this.channel.users) {
            this.channel.broadcastAll("setPermissions", perms);
        } else {
            users.forEach(function (u) {
                u.socket.emit("setPermissions", perms);
            });
        }
    }

    sendPlaylistLock(users: any): void {
        if (users === this.channel.users) {
            this.channel.broadcastAll("setPlaylistLocked", !this.openPlaylist);
        } else {
            var locked = !this.openPlaylist;
            users.forEach(function (u) {
                u.socket.emit("setPlaylistLocked", locked);
            });
        }
    }

    onUserPostJoin(user: any): void {
        user.socket.on("setPermissions", this.handleSetPermissions.bind(this, user));
        user.socket.on("togglePlaylistLock", this.handleTogglePlaylistLock.bind(this, user));
        this.sendPermissions([user]);
        this.sendPlaylistLock([user]);
    }

    handleTogglePlaylistLock(user: any): void {
        if (!this.hasPermission(user, "playlistlock")) {
            return;
        }

        this.openPlaylist = !this.openPlaylist;
        if (this.openPlaylist) {
            this.channel.logger.log("[playlist] " + user.getName() + " unlocked the playlist");
        } else {
            this.channel.logger.log("[playlist] " + user.getName() + " locked the playlist");
        }

        this.sendPlaylistLock(this.channel.users);
    }

    handleSetPermissions(user: any, perms: any): void {
        if (typeof perms !== "object") {
            return;
        }

        if (!this.canSetPermissions(user)) {
            user.kick("Attempted setPermissions as a non-admin");
            return;
        }

        for (var key in perms) {
            if (typeof perms[key] !== "number") {
                perms[key] = parseFloat(perms[key]);
                if (isNaN(perms[key])) {
                    delete perms[key];
                }
            }
        }

        for (var key in perms) {
            if (key in this.permissions) {
                this.permissions[key] = perms[key];
            }
        }

        if ("seeplaylist" in perms) {
            if (this.channel.modules.playlist) {
                this.channel.modules.playlist.sendPlaylist(this.channel.users);
            }
        }

        this.channel.logger.log("[mod] " + user.getName() + " updated permissions");
        this.sendPermissions(this.channel.users);
    }

    canAddVideo(account: any): bool {
        return this.hasPermission(account, "playlistadd");
    }

    canSetTemp(account: any): bool {
        return this.hasPermission(account, "settemp");
    }

    canSeePlaylist(account: any): bool {
        return this.hasPermission(account, "seeplaylist");
    }

    canAddList(account: any): bool {
        return this.hasPermission(account, "playlistaddlist");
    }

    canAddNonTemp(account: any): bool {
        return this.hasPermission(account, "addnontemp");
    }

    canAddNext(account: any): bool {
        return this.hasPermission(account, "playlistnext");
    }

    canAddLive(account: any): bool {
        return this.hasPermission(account, "playlistaddlive");
    }

    canAddCustom(account: any): bool {
        return this.hasPermission(account, "playlistaddcustom");
    }

    canAddRawFile(account: any): bool {
        return this.hasPermission(account, "playlistaddrawfile");
    }

    canMoveVideo(account: any): bool {
        return this.hasPermission(account, "playlistmove");
    }

    canDeleteVideo(account: any): bool {
        return this.hasPermission(account, "playlistdelete")
    }

    canSkipVideo(account: any): bool {
        return this.hasPermission(account, "playlistjump");
    }

    canToggleTemporary(account: any): bool {
        return this.hasPermission(account, "settemp");
    }

    canExceedMaxLength(account: any): bool {
        return this.hasPermission(account, "exceedmaxlength");
    }

    canShufflePlaylist(account: any): bool {
        return this.hasPermission(account, "playlistshuffle");
    }

    canClearPlaylist(account: any): bool {
        return this.hasPermission(account, "playlistclear");
    }

    canLockPlaylist(account: any): bool {
        return this.hasPermission(account, "playlistlock");
    }

    canAssignLeader(account: any): bool {
        return this.hasPermission(account, "leaderctl");
    }

    canControlPoll(account: any): bool {
        return this.hasPermission(account, "pollctl");
    }

    canVote(account: any): bool {
        return this.hasPermission(account, "pollvote");
    }

    canViewHiddenPoll(account: any): bool {
        return this.hasPermission(account, "viewhiddenpoll");
    }

    canVoteskip(account: any): bool {
        return this.hasPermission(account, "voteskip");
    }

    canSeeVoteskipResults(actor: any): bool {
        return this.hasPermission(actor, "viewvoteskip");
    }

    canMute(actor: any): bool {
        return this.hasPermission(actor, "mute");
    }

    canKick(actor: any): bool {
        return this.hasPermission(actor, "kick");
    }

    canBan(actor: any): bool {
        return this.hasPermission(actor, "ban");
    }

    canEditMotd(actor: any): bool {
        return this.hasPermission(actor, "motdedit");
    }

    canEditFilters(actor: any): bool {
        return this.hasPermission(actor, "filteredit");
    }

    canImportFilters(actor: any): bool {
        return this.hasPermission(actor, "filterimport");
    }

    canEditEmotes(actor: any): bool {
        return this.hasPermission(actor, "emoteedit");
    }

    canImportEmotes(actor: any): bool {
        return this.hasPermission(actor, "emoteimport");
    }

    canCallDrink(actor: any): bool {
        return this.hasPermission(actor, "drink");
    }

    canChat(actor: any): bool {
        return this.hasPermission(actor, "chat");
    }

    canClearChat(actor: any): bool {
        return this.hasPermission(actor, "chatclear");
    }

    canSetOptions(actor: any): bool {
        if (actor instanceof User) {
            actor = actor.account;
        }

        return actor.effectiveRank >= 2;
    }

    canSetCSS(actor: any): bool {
        if (actor instanceof User) {
            actor = actor.account;
        }

        return actor.effectiveRank >= 3;
    }

    canSetJS(actor: any): bool {
        if (actor instanceof User) {
            actor = actor.account;
        }

        return actor.effectiveRank >= 3;
    }

    canSetPermissions(actor: any): bool {
        if (actor instanceof User) {
            actor = actor.account;
        }

        return actor.effectiveRank >= 3;
    }

    canUncache(actor: any): bool {
        if (actor instanceof User) {
            actor = actor.account;
        }

        return actor.effectiveRank >= 2;
    }

    canExceedMaxItemsPerUser(actor: any): bool {
        return this.hasPermission(actor, "exceedmaxitems");
    }

    loadUnregistered(): any {
        var perms = {
            seeplaylist: -1,
            playlistadd: -1,      // Add video to the playlist
            playlistnext: 0,
            playlistmove: 0,      // Move a video on the playlist
            playlistdelete: 0,    // Delete a video from the playlist
            playlistjump: 0,      // Start a different video on the playlist
            playlistaddlist: 0,   // Add a list of videos to the playlist
            oplaylistadd: -1,     // Same as above, but for open (unlocked) playlist
            oplaylistnext: 0,
            oplaylistmove: 0,
            oplaylistdelete: 0,
            oplaylistjump: 0,
            oplaylistaddlist: 0,
            playlistaddcustom: 0, // Add custom embed to the playlist
            playlistaddlive: 0,   // Add a livestream to the playlist
            exceedmaxlength: 0,   // Add a video longer than the maximum length set
            addnontemp: 0,        // Add a permanent video to the playlist
            settemp: 0,           // Toggle temporary status of a playlist item
            playlistshuffle: 0,   // Shuffle the playlist
            playlistclear: 0,     // Clear the playlist
            pollctl: 0,           // Open/close polls
            pollvote: -1,         // Vote in polls
            viewhiddenpoll: 1.5,  // View results of hidden polls
            voteskip: -1,         // Vote to skip the current video
            viewvoteskip: 1.5,    // View voteskip results
            playlistlock: 2,      // Lock/unlock the playlist
            leaderctl: 0,         // Give/take leader
            drink: 0,             // Use the /d command
            chat: 0,              // Send chat messages
            chatclear: 2,         // Use the /clear command
            exceedmaxitems: 2     // Exceed max items per user
        };

        for (var key in perms) {
            this.permissions[key] = perms[key];
        }

        this.openPlaylist = true;
    }
}

export default PermissionsModule;
