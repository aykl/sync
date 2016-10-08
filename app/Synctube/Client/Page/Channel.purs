module Synctube.Client.Page.Channel where

import Synctube.Client.Page.Channel.EmoteList (emoteList)
import Synctube.Client.Page.Channel.UserOptions (userOptions)
import Synctube.Client.Page.Channel.Options (channelOptions)

import React (ReactElement)
import React.DOM as R
import React.DOM.Props as RP
import Synctube.Client.Component.Common.Input as I


type State =
  { channel :: Channel
  , sioSource :: String
  }


type Channel =
  { name :: String }


mainpageSection :: State -> ReactElement
mainpageSection state =
  R.section [ RP._id "mainpage" ]
            [ R.div [ RP.className "container" ]
                    [ motd
                    , announcements
                    , drinkBar
                    , main
                    , controls
                    , playlist
                    , resize
                    , siteFooter
                    ]
            ]


otherSections :: State -> Array ReactElement
otherSections state =
  [ userOptions
  , emoteList
  , channelOptions state.channel.name
  , R.div [ RP._id "pmbar" ] []
  ]


scripts :: State -> Array ReactElement
scripts state =
  [ R.script  [ RP._id "socketio-js", RP.src state.sioSource ] []
  , R.script  [ RP.src "/js/data.js" ] []
  , R.script  [ RP.src "/js/util.js" ] []
  , R.script  [ RP.src "/js/player.js" ] []
  , R.script  [ RP.src "/js/paginator.js" ] []
  , R.script  [ RP.src "/js/ui.js" ] []
  , R.script  [ RP.src "/js/callbacks.js" ] []
  , R.script  [ RP.defer "true"
              , RP.src "https://www.youtube.com/iframe_api" ] []
  , R.script  [ RP.defer "true", RP.src "https://api.dmcdn.net/all.js" ] []
  , R.script  [ RP.defer "true", RP.src "/js/sc.js" ] []
  , R.script  [ RP.defer "true", RP.src "/js/froogaloop.min.js" ] []
  , R.script  [ RP.defer "true", RP.src "/js/video.js" ] []
  , R.script  [ RP.defer "true", RP.src "/js/videojs-contrib-hls.min.js" ] []
  , R.script  [ RP.defer "true"
              , RP.src "https://player.twitch.tv/js/embed/v1.js" ] []
  , R.script  [ RP._type "text/javascript"
              , RP.dangerouslySetInnerHTML { __html: scriptBody }
              ] []
  ]

  where

  scriptBody =
    """document.querySelector("._tempClass_requestChatFilters")
      .onclick = function () { socket.emit('requestChatFilters'); };
    document.querySelector("._tempClass_requestChannelRanks")
      .onclick = function () { socket.emit('requestChannelRanks'); };
    document.querySelector("._tempClass_requestBanlist")
      .onclick = function () { socket.emit('requestBanlist'); };
    document.querySelector("._tempClass_readChanLog")
      .onclick = function () { socket.emit('readChanLog'); };
    document.querySelector("._tempClass_saveUserOptions")
      .onclick = function () { saveUserOptions(); };"""


motd :: ReactElement
motd =
  R.div [ RP._id "motdrow", RP.className "row" ]
        [ R.div [ RP.className "col-lg-12 col-md-12" ]
                [ R.div [ RP._id "motdwrap", RP.className "well" ]
                        [ toggleButton
                        , R.div [ RP._id "motd" ] []
                        , R.div [ RP.className "clear" ] []
                        ]
                ]
        ]

  where

  toggleButton :: ReactElement
  toggleButton =
    R.button  [ RP._id "togglemotd"
              , RP.className "close pull-right"
              , RP._type "button"
              ]
              [ R.span [ RP.className "glyphicon glyphicon-minus" ] [] ]


announcements :: ReactElement
announcements =
  R.div [ RP._id "announcements", RP.className "row" ] []


drinkBar :: ReactElement
drinkBar =
  R.div [ RP._id "drinkbarwrap", RP.className "row" ]
        [ R.div [ RP._id "drinkbar", RP.className "col-lg-12 col-md-12" ]
                [ R.h1 [ RP._id "drinkcount" ] [] ]
        ]


main :: ReactElement
main =
  R.div [ RP._id "main", RP.className "row" ]
        [ chat
        , video
        ]

  where

  chat :: ReactElement
  chat =
    R.div [ RP._id "chatwrap", RP.className "col-lg-5 col-md-5" ]
          [ chatHeader
          , R.div [ RP._id "userlist"] []
          , R.div [ RP._id "messagebuffer", RP.className "linewrap" ] []
          , I.text' [ RP._id "chatline", RP.className "form-control"
                    , RP.maxLength "240", RP.style { "display": "none" }
                    ]
          , R.div [ RP._id "guestlogin", RP.className "input-group" ]
                  [ R.span  [ RP.className "input-group-addon" ]
                            [ R.text "Guest login" ]
                  , I.text' [ RP._id "guestname", RP.className "form-control"
                            , RP.placeholder "Name"
                            ]
                  ]
          ]

  chatHeader :: ReactElement
  chatHeader =
    R.div [ RP._id "chatheader" ]
          [ R.i [ RP._id "userlisttoggle"
                , RP.className "glyphicon glyphicon-chevron-down pull-left pointer"
                , RP.title "Show/Hide Userlist"
                ] []
          , R.span  [ RP._id "usercount", RP.className "pointer" ]
                    [ R.text "Not Connected" ]
          , R.span  [ RP._id "modflair"
                    , RP.className "label label-default pull-right pointer"
                    ]
                    [ R.text "Name Color" ]
          ]

  video :: ReactElement
  video =
    R.div [ RP._id "videowrap", RP.className "col-lg-7 col-md-7" ]
      [ R.p [ RP._id "currenttitle" ] [ R.text "Nothing Playing" ]
      , R.div [ RP.className "embed-responsive embed-responsive-16by9" ]
          [ R.div
              [ RP._id "ytapiplayer", RP.className "embed-responsive-item" ]
              []
          ]
      ]


controls :: ReactElement
controls =
  R.div [ RP._id "controlsrow", RP.className "row" ]
    [ R.div [ RP._id "leftcontrols", RP.className "col-lg-5 col-md-5" ]
        [ R.button [ RP._id "newpollbtn", RP.className "btn btn-sm btn-default" ]
            [ R.text "New Poll" ]
        , R.button [ RP._id "emotelistbtn", RP.className "btn btn-sm btn-default" ]
            [ R.text "Emote List" ]
        ]
    , R.div [ RP._id "rightcontrols", RP.className "col-lg-7 col-md-7" ]
        [ plControl
        , videoControls
        ]
    ]

  where

  plControl :: ReactElement
  plControl =
    R.div [ RP._id "plcontrol", RP.className "btn-group" ]
      [ R.button
          [ RP._id "showsearch", RP.className "btn btn-sm btn-default"
          , RP.title "Search for a video"
          , RP._data {toggle: "collapse", target: "#searchcontrol"}
          ]
          [ R.span [ RP.className "glyphicon glyphicon-search" ] [] ]
      , R.button
          [ RP._id "showmediaurl", RP.className "btn btn-sm btn-default"
          , RP.title "Add video from URL"
          , RP._data {toggle: "collapse", target: "#addfromurl"}
          ]
          [ R.span [ RP.className "glyphicon glyphicon-plus" ] [] ]
      , R.button
          [ RP._id "showcustomembed", RP.className "btn btn-sm btn-default"
          , RP.title "Embed a custom frame"
          , RP._data {toggle: "collapse", target: "#customembed"}
          ]
          [ R.span [ RP.className "glyphicon glyphicon-th-large"] [] ]
      , R.button
          [ RP._id "showplaylistmanager", RP.className "btn btn-sm btn-default"
          , RP.title "Manage playlists"
          , RP._data {toggle: "collapse", target: "#playlistmanager"}
          ]
          [ R.span [ RP.className "glyphicon glyphicon-list" ] [] ]
      , R.button
          [ RP._id "clearplaylist", RP.className "btn btn-sm btn-default"
          , RP.title "Clear the playlist"
          ]
          [ R.span [ RP.className "glyphicon glyphicon-trash" ] [] ]
      , R.button
          [ RP._id "shuffleplaylist", RP.className "btn btn-sm btn-default"
          , RP.title "Shuffle the playlist"
          ]
          [ R.span [ RP.className "glyphicon glyphicon-sort" ] [] ]
      , R.button
          [ RP._id "qlockbtn", RP.className "btn btn-sm btn-danger"
          , RP.title "Playlist locked"
          ]
          [ R.span [ RP.className "glyphicon glyphicon-lock" ] [] ]
      ]

  videoControls :: ReactElement
  videoControls =
    R.div [ RP._id "videocontrols", RP.className "btn-group pull-right" ]
      [ R.button
          [ RP._id "mediarefresh", RP.className "btn btn-sm btn-default"
          , RP.title "Reload the video player"
          ]
          [ R.span [ RP.className "glyphicon glyphicon-retweet" ] [] ]
      , R.button
          [ RP._id "fullscreenbtn", RP.className "btn btn-sm btn-default"
          , RP.title "Make the video player fullscreen"
          ]
          [ R.span [ RP.className "glyphicon glyphicon-fullscreen" ] [] ]
      , R.button
          [ RP._id "getplaylist", RP.className "btn btn-sm btn-default"
          , RP.title "Retrieve playlist links"
          ]
          [ R.span [ RP.className "glyphicon glyphicon-link" ] [] ]
      , R.button
          [ RP._id "voteskip", RP.className "btn btn-sm btn-default"
          , RP.title "Voteskip"
          ]
          [ R.span [ RP.className "glyphicon glyphicon-step-forward" ] [] ]
      ]


playlist :: ReactElement
playlist =
  R.div [ RP._id "playlistrow", RP.className "row" ]
    [ R.div [ RP._id "leftpane", RP.className "col-lg-5 col-md-5" ]
        [ R.div [ RP._id "leftpane-inner", RP.className "row" ]
            [ R.div
                [ RP._id "pollwrap"
                , RP.className "col-lg-12 col-md-12"
                ] []
            , R.div
                [ RP._id "playlistmanagerwrap"
                , RP.className "col-lg-12 col-md-12"
                ] []
            ]
        ]
    , R.div [ RP._id "rightpane", RP.className "col-lg-7 col-md-7" ]
        [ R.div [ RP._id "rightpane-inner", RP.className "row" ]
            [ searchControl
            , addFromUrl
            , customEmbed
            , playlistManager
            , queueFail
            , videoList
            ]
        ]
    ]

  where

  searchControl :: ReactElement
  searchControl =
    R.div
      [ RP._id "searchcontrol"
      , RP.className "collapse plcontrol-collapse col-lg-12 col-md-12"
      ]
      [ R.div [ RP.className "vertical-spacer" ] []
      , R.div [ RP.className "input-group" ]
          [ R.input
              [ RP._id "library_query", RP.className "form-control"
              , RP._type "text", RP.placeholder "Search query"
              ] []
          , R.span [ RP.className "input-group-btn" ]
              [ R.button
                  [ RP._id "library_search", RP.className "btn btn-default" ]
                  [ R.text "Library" ]
              ]
          , R.span [ RP.className "input-group-btn" ]
              [ R.button
                  [ RP._id "youtube_search", RP.className "btn btn-default" ]
                  [ R.text "YouTube" ]
              ]
          ]
      , R.div [ RP.className "checkbox" ]
          [ R.label'
              [ R.input [ RP.className "add-temp", RP._type "checkbox" ] []
              , R.text "Add as temporary"
              ]
          ]
      , R.ul [ RP._id "library", RP.className "videolist col-lg-12 col-md-12" ]
          []
      ]

  addFromUrl :: ReactElement
  addFromUrl =
    R.div
      [ RP._id "addfromurl"
      , RP.className "collapse plcontrol-collapse col-lg-12 col-md-12"
      ]
      [ R.div [ RP.className "vertical-spacer" ] []
      , R.div [ RP.className "input-group" ]
          [ R.input
              [ RP._id "mediaurl", RP.className "form-control"
              , RP._type "text", RP.placeholder "Media URL"
              ] []
          , R.span [ RP.className "input-group-btn" ]
              [ R.button [ RP._id "queue_next", RP.className "btn btn-default" ]
                  [ R.text "Next" ]
              ]
          , R.span [ RP.className "input-group-btn" ]
              [ R.button [ RP._id "queue_end", RP.className "btn btn-default" ]
                  [ R.text "At End" ]
              ]
          ]
      , R.div [ RP.className "checkbox" ]
          [ R.label'
              [ R.input [ RP.className "add-temp", RP._type "checkbox" ] []
              , R.text "Add as temporary"
              ]
          ]
      , R.div [ RP._id "addfromurl-queue" ] []
      ]

  customEmbed :: ReactElement
  customEmbed =
    R.div
      [ RP._id "customembed"
      , RP.className "collapse plcontrol-collapse col-lg-12 col-md-12" ]
      [ R.div [ RP.className "vertical-spacer" ] []
      , R.div [ RP.className "input-group" ]
          [ R.input
              [ RP._id "customembed-title", RP.className "form-control"
              , RP._type "text", RP.placeholder "Title (optional)"
              ] []
          , R.span  [ RP.className "input-group-btn" ]
                    [ R.button  [ RP._id "ce_queue_next"
                                , RP.className "btn btn-default"
                                ]
                                [ R.text "Next" ]
                    ]
          , R.span  [ RP.className "input-group-btn" ]
                    [ R.button  [ RP._id "ce_queue_end"
                                , RP.className "btn btn-default"
                                ]
                                [ R.text "At End" ]
                    ]
          ]
      , R.div [ RP.className "checkbox" ]
          [ R.label'
              [ R.input [ RP.className "add-temp", RP._type "checkbox" ] []
              , R.text "Add as temporary"
              ]
          ]
      , R.text "Paste the embed code below and click Next or At End."
      , R.text "Acceptable embed codes are "
      , R.code' [ R.text "<iframe>" ]
      , R.text " and "
      , R.code' [ R.text "<object>" ]
      , R.text " tags.  "
      , R.strong' [ R.text "CUSTOM EMBEDS CANNOT BE SYNCHRONIZED." ]
      , R.textarea  [ RP._id "customembed-content"
                    , RP.className "input-block-level form-control"
                    , RP.rows "3"
                    ] []
      ]

  playlistManager :: ReactElement
  playlistManager =
    R.div
      [ RP._id "playlistmanager"
      , RP.className "collapse plcontrol-collapse col-lg-12 col-md-12"
      ]
      [ R.div [ RP.className "vertical-spacer" ] []
      , R.div [ RP.className "input-group" ]
              [ I.text' [ RP._id "userpl_name", RP.className "form-control"
                        , RP.placeholder "Playlist Name" ]
              , R.span  [ RP.className "input-group-btn" ]
                        [ R.button  [ RP._id "userpl_save"
                                    , RP.className "btn btn-default"
                                    ]
                                    [ R.text "Save" ]
                        ]
              ]
      , R.div [ RP.className "checkbox" ]
              [ R.label'
                  [ R.input [ RP.className "add-temp", RP._type "checkbox" ] []
                  , R.text "Add as temporary"
                  ]
              ]
      , R.ul [ RP._id "userpl_list", RP.className "videolist" ] []
      ]


  queueFail :: ReactElement
  queueFail =
    R.div [ RP._id "queuefail", RP.className "col-lg-12 col-md-12" ]
          [ R.div [ RP.className "" ] [] ]


  videoList :: ReactElement
  videoList =
    R.div [ RP.className "col-lg-12 col-md-12" ]
          [ R.ul [ RP._id "queue", RP.className "videolist" ] []
          , R.div [ RP._id "plmeta" ]
                  [ R.span [ RP._id "plcount" ] [ R.text "0 items" ]
                  , R.span [ RP._id "pllength" ] [ R.text "00:00:00" ]
                  ]
          ]


resize :: ReactElement
resize =
  R.div [ RP._id "resizewrap", RP.className "row" ]
        [ R.div [ RP.className "col-lg-5 col-md-5" ] []
        , R.div [ RP._id "videowidth", RP.className "col-lg-7 col-md-7" ] []
        ]


siteFooter :: ReactElement
siteFooter = R.div [ RP._id "sitefooter" ] []
