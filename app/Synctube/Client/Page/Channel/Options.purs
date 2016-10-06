module Synctube.Client.Page.Channel.Options (channelOptions) where

import Prelude

import Data.Maybe (Maybe(..))

import React (ReactElement)
import React.DOM as R
import React.DOM.Props as RP


channelOptions :: String -> ReactElement
channelOptions channelName =
  R.div
    [ RP._id "channeloptions", RP.className "modal fade"
    , RP.tabIndex "-1", RP.role "dialog", RP.aria {hidden: "true"}
    ]
    [ R.div [ RP._id "modal-dialog" ]
        [ R.div [ RP.className "modal-content" ]
            [ header
            , body channelName
            , footer
            ]
        ]
    ]


header :: ReactElement
header =
  R.div [ RP.className "modal-header" ]
    [ R.button
        [ RP.className "close"
        , RP._data {dismiss: "modal"}, RP.aria {hidden: "true"}
        ]
        [ R.text "×" ]
    , R.h4' [ R.text "Channel Settings" ]
    , R.ul [ RP.className "nav nav-tabs" ]
        [ R.li [ RP.className "active" ]
            [ R.a [ RP.href "#cs-miscoptions", RP._data {toggle: "tab"} ]
                [ R.text "General Settings" ]
            ]
        , R.li'
            [ R.a [ RP.href "#cs-adminoptions", RP._data {toggle: "tab"} ]
                [ R.text "Admin Settings" ]
            ]
        , R.li [ RP.className "dropdown" ]
            [ R.a
                [ RP._id "cs-edit-dd-toggle", RP.href "#"
                , RP._data {toggle: "dropdown"}
                ]
                [ R.text "Edit"
                , R.span [ RP.className "caret" ] []
                ]
            , R.ul [ RP.className "dropdown-menu" ]
                [ R.li'
                    [ R.a
                        [ RP.href "#cs-chatfilters", RP._data {toggle: "tab"}
                        , RP.unsafeMkProps "onclick" "javascript:socket.emit('requestChatFilters')"
                        ]
                        [ R.text "Chat Filters" ]
                    ]
                , R.li'
                    [ R.a [ RP.href "#cs-emotes", RP._data {toggle: "tab"} ]
                        [ R.text "Emotes" ]
                    ]
                , R.li'
                    [ R.a
                        [ RP.href "#cs-motdeditor"
                        , RP._data {toggle: "tab"}, RP.tabIndex "-1"
                        ]
                        [ R.text "MOTD" ]
                    ]
                , R.li'
                    [ R.a
                        [ RP.href "#cs-csseditor"
                        , RP._data {toggle: "tab"}, RP.tabIndex "-1"
                        ]
                        [ R.text "CSS" ]
                    ]
                , R.li'
                    [ R.a
                        [ RP.href "#cs-jseditor"
                        , RP._data {toggle: "tab"}, RP.tabIndex "-1"
                        ]
                        [ R.text "Javascript" ]
                    ]
                , R.li'
                    [ R.a
                        [ RP.href "#cs-permedit"
                        , RP._data {toggle: "tab"}, RP.tabIndex "-1"
                        ]
                        [ R.text "Permissions" ]
                    ]
                , R.li'
                    [ R.a
                        [ RP.href "#cs-chanranks", RP._data {toggle: "tab"}
                        , RP.tabIndex "-1"
                        , RP.unsafeMkProps "onclick"
                            "javascript:socket.emit('requestChannelRanks')"
                        ]
                        [ R.text "Moderators" ]
                    ]
                ]
            ]
        , R.li'
            [ R.a
                [ RP.href "#cs-banlist", RP._data {toggle: "tab"}, RP.tabIndex "-1"
                , RP.unsafeMkProps "onclick" "javascript:socket.emit('requestBanlist')"
                ]
                [ R.text "Ban list" ]
            ]
        , R.li'
            [ R.a
                [ RP.href "#cs-chanlog", RP._data {toggle: "tab"}
                , RP.unsafeMkProps "onclick"
                    "javascript:socket.emit('readChanLog')"
                ]
                [ R.text "Log" ]
            ]
        ]
    ]


body :: String -> ReactElement
body channelName =
  R.div [ RP.className "modal-body" ]
    [ R.div [ RP.className "tab-content" ]
        [ miscoptions
        , adminoptions channelName
        , motdeditor
        , csseditor
        , jseditor
        , banlist
        , recentjoins
        , chanranks
        , chatfilters
        , emotes
        , chanlog
        , permeditor
        ]
    ]


footer :: ReactElement
footer =
  R.div [ RP.className "modal-footer" ]
    [ R.button
        [ RP.className "btn btn-default", RP._type "button"
        , RP._data {dismiss: "modal"}
        ]
        [ R.text "Close" ]
    ]


chanlog :: ReactElement
chanlog =
  R.div [ RP._id "cs-chanlog", RP.className "tab-pane" ]
    [ R.h4' [ R.text "Channel Log" ]
    , R.strong' [ R.text "Filter Log:" ]
    , R.select
        [ RP._id "cs-chanlog-filter"
        , RP.className "form-control"
        , RP.multiple "multiple"
        ] []
    , R.pre [ RP._id "cs-chanlog-text" ] []
    , R.button [ RP.className "btn btn-default", RP._id "cs-chanlog-refresh" ]
        [ R.text "Refresh" ]
    ]


permeditor :: ReactElement
permeditor =
  R.div [ RP._id "cs-permedit", RP.className "tab-pane" ] []


emotes :: ReactElement
emotes =
  R.div [ RP._id "cs-emotes", RP.className "tab-pane" ]
    [ R.h4' [ R.text "Emotes" ]
    , R.form
        [ RP.className "form-horizontal", RP.action "javascript:void(0)"
        , RP.role "form"
        ]
        [ textbox "cs-emotes-newname" "Emote name" Nothing
        , textbox "cs-emotes-newimage" "Emote image" Nothing
        , R.div [ RP.className "form-group" ]
            [ R.div [ RP.className "col-sm-8 col-sm-offset-4" ]
                [ R.button
                    [ RP._id "cs-emotes-newsubmit"
                    , RP.className "btn btn-primary"
                    ]
                    [ R.text "Create Emote" ]
                ]
            ]
        ]
    , R.form [ RP.className "form-inline" ]
        [ R.div [ RP.className "form-group" ]
            [ R.input
                [ RP.className "emotelist-search form-control"
                , RP._type "text", RP.placeholder "Search"
                ] []
            ]
        , R.div [ RP.className "form-group" ]
            [ R.div [ RP.className "checkbox" ]
                [ R.label'
                    [ R.input
                        [ RP.className "emotelist-alphabetical"
                        , RP._type "checkbox"
                        ] []
                    , R.text "Sort alphabetically"
                    ]
                ]
            ]
        ]
    , R.div [ RP.className "emotelist-paginator-container" ] []
    , R.table
        [ RP.className "emotelist-table table table-striped table-condensed" ]
        [ R.thead'
            [ R.tr'
                [ R.th' [ R.text "Delete" ]
                , R.th' [ R.text "Name" ]
                , R.th' [ R.text "Image" ]
                ]
            ]
        , R.tbody' []
        ]
    , R.button [ RP._id "cs-emotes-export", RP.className "btn btn-default" ]
        [ R.text "Export emote list" ]
    , R.button [ RP._id "cs-emotes-import", RP.className "btn btn-default" ]
        [ R.text "Import emote list" ]
    , R.textarea
        [ RP._id "cs-emotes-exporttext", RP.className "form-control"
        , RP.rows "5"
        ] []
    ]


textbox :: String -> String -> Maybe String -> ReactElement
textbox _id label placeholder =
  R.div [ RP.className "form-group" ]
    [ R.label [ RP.className "control-label col-sm-4", RP.htmlFor _id ]
        [ R.text label ]
    , R.div [ RP.className "col-sm-8" ]
        [ input placeholder ]
    ]

  where

  input :: Maybe String -> ReactElement
  input (Just placeholder) =
    R.input
      [ RP.className "form-control", RP._id _id
      , RP._type "text", RP.placeholder placeholder
      ] []

  input Nothing =
    R.input [ RP.className "form-control", RP._id _id, RP._type "text"] []


chatfilters :: ReactElement
chatfilters =
  R.div [ RP._id "cs-chatfilters", RP.className "tab-pane" ]
    [ R.h4' [ R.text "Chat Filters" ]
    , R.form
        [ RP.className "form-horizontal"
        , RP.action "javascript:void(0)"
        , RP.role "form"
        ]
        [ textbox "cs-chatfilters-newname" "Filter name" Nothing
        , textbox "cs-chatfilters-newregex" "Filter regex" Nothing
        , R.div [ RP.className "form-group" ]
            [ R.label
                [ RP.className "control-label col-sm-4"
                , RP.htmlFor "cs-chatfilters-newflags"
                ]
                [ R.text "Flags" ]
            , R.div [ RP.className "col-sm-8" ]
                [ R.input
                    [ RP._id "cs-chatfilters-newflags"
                    , RP.className "form-control cs-textbox"
                    , RP._type "text", RP.value "g"
                    ] []
                ]
            ]
        , textbox "cs-chatfilters-newreplace" "Replacement" Nothing
        , R.div [ RP.className "form-group" ]
            [ R.div [ RP.className "col-sm-8 col-sm-offset-4" ]
                [ R.button
                    [ RP._id "cs-chatfilters-newsubmit"
                    , RP.className "btn btn-primary"
                    ]
                    [ R.text "Create Filter" ]
                ]
            ]
        ]
    , R.table [ RP.className "table table-striped table-condensed" ]
        [ R.thead'
            [ R.tr'
                [ R.th' [ R.text "Control" ]
                , R.th' [ R.text "Name" ]
                , R.th' [ R.text "Active" ]
                ]
            ]
        ]
    , R.button
        [ RP._id "cs-chatfilters-export", RP.className "btn btn-default"]
        [ R.text "Export filter list" ]
    , R.button
        [ RP._id "cs-chatfilters-import", RP.className "btn btn-default"]
        [ R.text "Import filter list" ]
    , R.textarea
        [ RP._id "cs-chatfilters-exporttext"
        , RP.className "form-control"
        , RP.rows "5"
        ] []
    ]


chanranks :: ReactElement
chanranks =
  R.div [ RP._id "cs-chanranks", RP.className "tab-pane" ]
    [ R.h4' [ R.text "Moderator List" ]
    , R.form
        [ RP.className "form-inline"
        , RP.action "javascript:void(0)", RP.role "form"
        ]
        [ R.div [ RP.className "input-group" ]
            [ R.input
                [ RP._id "cs-chanranks-name", RP.className "form-control"
                , RP._type "text", RP.placeholder "Name"
                ] []
            , R.span [ RP.className "input-group-btn" ]
                [ R.button
                    [ RP._id "cs-chanranks-mod", RP.className "btn btn-success" ]
                    [ R.text "+Mod" ]
                , R.button
                    [ RP._id "cs-chanranks-adm", RP.className "btn btn-info" ]
                    [ R.text "+Admin" ]
                , R.button
                    [ RP._id "cs-chanranks-owner", RP.className "btn btn-info" ]
                    [ R.text "+Owner" ]
                ]
            ]
        ]
    , R.table [ RP.className "table table-striped" ]
        [ R.thead'
            [ R.tr'
                [ R.th' [ R.text "Name" ]
                , R.th' [ R.text "Rank" ]
                ]
            ]
        ]
    ]


recentjoins :: ReactElement
recentjoins =
  R.div [ RP._id "cs-recentjoins", RP.className "tab-pane" ]
    [ R.h4' [ R.text "Recent connections" ]
    , R.table [ RP.className "table table-striped" ]
        [ R.thead'
            [ R.tr'
                [ R.th' [ R.text "Name" ]
                , R.th' [ R.text "Aliases" ]
                , R.th' [ R.text "Time" ]
                ]
            ]
        ]
    ]


jseditor :: ReactElement
jseditor =
  R.div [ RP._id "cs-jseditor", RP.className "tab-pane" ]
    [ R.h4' [ R.text "JS editor" ]
    , R.p'
        [ R.text
            """Maximum size 20KB.
            If more space is required, use the External JS option
            under General Settings to link
            to an externally hosted stylesheet."""
        ]
    , R.textarea
        [ RP.className "form-control", RP._id "cs-jstext", RP.rows "10" ]
        []
    , R.button [ RP.className "btn btn-primary", RP._id "cs-jssubmit" ]
        [ R.text "Save JS" ]
    ]


banlist :: ReactElement
banlist =
  R.div [ RP._id "cs-banlist", RP.className "tab-pane" ]
    [ R.h4' [ R.text "Ban list" ]
    , R.table [ RP.className "table table-striped" ]
        [ R.thead'
            [ R.tr'
                [ R.th' [ R.text "Unban" ]
                , R.th' [ R.text "IP" ]
                , R.th' [ R.text "Name" ]
                , R.th' [ R.text "Banned by" ]
                ]
            ]
        ]
    ]


lcheckbox :: String -> String -> ReactElement
lcheckbox _id label =
  R.div [ RP.className "form-group" ]
    [ R.label [ RP.className "control-label col-sm-4", RP.htmlFor _id ]
        [ R.text label ]
    , R.div [ RP.className "col-sm-8" ]
        [ R.div [ RP.className "checkbox" ]
            [ R.input [ RP._type "checkbox", RP._id _id ] [] ]
        ]
    ]


rcheckbox :: String -> String -> ReactElement
rcheckbox _id label =
  R.div [ RP.className "form-group" ]
    [ R.div [ RP.className "col-sm-8 col-sm-offset-4" ]
        [ R.div [ RP.className "checkbox" ]
            [ R.label [ RP.htmlFor _id ]
                [ R.input [ RP._type "checkbox", RP._id _id ] []
                , R.text label
                ]
            ]
        ]
    ]


lcheckboxAuto :: String -> String -> ReactElement
lcheckboxAuto _id label =
  R.div [ RP.className "form-group" ]
    [ R.label [ RP.className "control-label col-sm-4", RP.htmlFor _id ]
        [ R.text label ]
    , R.div [ RP.className "col-sm-8" ]
        [ R.div [ RP.className "checkbox" ]
            [ R.input
                [ RP.className "cs-checkbox", RP._type "checkbox", RP._id _id ]
                []
            ]
        ]
    ]


rcheckboxAuto :: String -> String -> ReactElement
rcheckboxAuto _id label =
  R.div [ RP.className "form-group" ]
    [ R.div [ RP.className "col-sm-8 col-sm-offset-4" ]
        [ R.div [ RP.className "checkbox" ]
            [ R.label [ RP.htmlFor _id ]
                [ R.input
                      [ RP.className "cs-checkbox", RP._type "checkbox"
                      , RP._id _id
                      ] []
                , R.text label
                ]
            ]
        ]
    ]


textboxAuto :: String -> String -> Maybe String -> ReactElement
textboxAuto _id label placeholder =
  R.div [ RP.className "form-group" ]
    [ R.label [ RP.className "control-label col-sm-4", RP.htmlFor _id ]
        [ R.text label ]
    , R.div [ RP.className "col-sm-8" ]
        [ input placeholder ]
    ]

  where

  input (Just placeholder) =
    R.input
      [ RP.className "form-control cs-textbox", RP._id _id
      , RP._type "text", RP.placeholder placeholder
      ] []

  input Nothing =
    R.input
      [ RP.className "form-control cs-textbox", RP._id _id, RP._type "text" ] []


textboxTimeinputAuto :: String -> String -> Maybe String -> ReactElement
textboxTimeinputAuto _id label placeholder =
  R.div [ RP.className "form-group" ]
    [ R.label [ RP.className "control-label col-sm-4", RP.htmlFor _id ]
        [ R.text label ]
    , R.div [ RP.className "col-sm-8" ]
        [ input placeholder ]
    ]

  where

  input :: Maybe String -> ReactElement
  input (Just placeholder) =
    R.input
      [ RP.className "form-control cs-textbox-timeinput", RP._id _id
      , RP._type "text", RP.placeholder placeholder
      ] []

  input Nothing =
    R.input
      [ RP.className "form-control cs-textbox-timeinput"
      , RP._id _id, RP._type "text"
      ] []


miscoptions :: ReactElement
miscoptions =
  R.div [ RP._id "cs-miscoptions", RP.className "tab-pane active" ]
    [ R.h4' [ R.text "General Settings"]
    , R.form [ RP.className "form-horizontal", RP.action "javascript:void(0)" ]
        [ rcheckboxAuto "cs-allow_voteskip" "Allow voteskip"
        , rcheckboxAuto "cs-allow_dupes"
            "Allow duplicate videos on the playlist"
        , textboxAuto "cs-voteskip_ratio" "Voteskip ratio" (Just "0.5")
        , textboxAuto "cs-maxlength" "Max video length" (Just "HH:MM:SS")
        , textboxAuto "cs-afk_timeout" "Auto-AFK Delay" (Just "0 (disabled)")
        , R.div [ RP.className "form-group" ]
            [ R.div [ RP.className "col-sm-offset-4" ] [] ]
        ]
    , R.h4' [ R.text "Chat Settings" ]
    , R.div
        [ RP.className "form form-horizontal", RP.action "javascript:void(0)" ]
        [ rcheckboxAuto "cs-enable_link_regex" "Convert URLs in chat to links"
        , rcheckboxAuto "cs-chat_antiflood" "Throttle chat"
        , textboxAuto "cs-chat_antiflood_burst"
            "# of messages allowed before throttling" Nothing
        , textboxAuto "cs-chat_antiflood_sustained"
            "# of messages (after burst) allowed per second" Nothing
        , textboxTimeinputAuto "cs-new_user_chat_delay"
            "Delay before new accounts can chat" (Just "0")
        , R.div [ RP.className "form-group" ]
            [ R.div [ RP.className "col-sm-8 col-sm-offset-4" ]
                [ R.span [ RP.className "text-info" ]
                    [ R.text
                        """Restrictions to new accounts can be disabled
                        by setting the delay to 0."""
                    ]
                ]
            ]
        , textboxTimeinputAuto "cs-new_user_chat_link_delay"
            "Delay before new accounts can post links in chat" (Just "0")
        , R.div [ RP.className "form-group" ]
            [ R.div [ RP.className "col-sm-8 col-sm-offset-4" ]
                [ R.span [ RP.className "text-info" ]
                    [ R.text "Changes are automatically saved." ]
                ]
            ]
        ]
    ]


adminoptions :: String -> ReactElement
adminoptions channelName =
  R.div [ RP._id "cs-adminoptions", RP.className "tab-pane" ]
    [ R.h4' [ R.text "Admin-Only Settings" ]
    , R.form [ RP.className "form-horizontal", RP.action "javascript:void(0)" ]
        [ textboxAuto "cs-pagetitle" "Page title" (Just defname)
        , textboxAuto "cs-password" "Password" (Just "leave blank to disable")
        , textboxAuto "cs-externalcss" "External CSS" (Just "Stylesheet URL")
        , textboxAuto "cs-externaljs" "External Javascript" (Just "Script URL")
        , rcheckboxAuto "cs-show_public" "List channel publicly"
        , rcheckboxAuto "cs-torbanned" "Block connections from Tor"
        , rcheckboxAuto "cs-allow_ascii_control"
            "Allow ASCII control characters (e.g. newlines)"
        , textboxAuto "cs-playlist_max_per_user"
            "Maximum # of videos per user" Nothing
        , R.div [ RP.className "form-group" ]
            [ R.div [ RP.className "col-sm-8 col-sm-offset-4" ]
                [ R.span [ RP.className "text-info" ]
                    [ R.text "Set to 0 for no limit" ]
                ]
            ]
        , R.div [ RP.className "form-group" ]
            [ R.div [ RP.className "col-sm-8 col-sm-offset-4" ]
                [ R.span [ RP.className "text-info" ]
                    [ R.text "Changes are automatically saved." ]
                ]
            ]
        ]
    ]

  where

  defname = "CyTube - /r/" <> channelName


motdeditor :: ReactElement
motdeditor =
  R.div [ RP._id "cs-motdeditor", RP.className "tab-pane" ]
    [ R.h4' [ R.text "MOTD editor" ]
    , R.p'
          [ R.text
              """The MOTD can be formatted using a subset of HTML.
              Tags which attempt to execute Javascript will be removed."""
          ]
    , R.textarea
        [ RP.className "form-control"
        , RP._id "cs-motdtext", RP.rows "10"
        ] []
    , R.button [ RP.className "btn btn-primary", RP._id "cs-motdsubmit" ]
        [ R.text "Save MOTD" ]
    ]


csseditor :: ReactElement
csseditor =
  R.div [ RP._id "cs-csseditor", RP.className "tab-pane" ]
    [ R.h4' [ R.text "CSS editor" ]
    , R.p'
        [ R.text
            """Maximum size 20KB.
            If more space is required, use the External CSS option
            under General Settings to link
            to an externally hosted stylesheet."""
        ]
    , R.textarea
        [ RP.className "form-control", RP._id "cs-csstext", RP.rows "10" ]
        []
    , R.button [ RP.className "btn btn-primary", RP._id "cs-csssubmit" ]
        [ R.text "Save CSS" ]
    ]
