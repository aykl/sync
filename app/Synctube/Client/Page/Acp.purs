module Synctube.Client.Page.Acp where

import React (ReactElement)
import React.DOM as R
import React.DOM.Props as RP
import Synctube.Client.Component.Common.Input as I


type State =
  { sioSource :: String }


mainpageSection :: State -> ReactElement
mainpageSection state =
  R.section [ RP._id "mainpage" ]
            [ R.div [ RP.className "container" ]
                    [ R.div [ RP.className "row" ]
                            [ logViewer
                            , announcements
                            , globalBans
                            , users
                            , channels
                            , loadedChannels
                            , eventLog
                            , stats
                            ]
                    ]
            ]


scripts :: State -> Array ReactElement
scripts state =
  [ R.script  [ RP._type "text/javascript"
              , RP.dangerouslySetInnerHTML
                  { __html: "var USEROPTS = { secure_connection: true };" }
              ] []
  , R.script [ RP.src state.sioSource ] []
  , R.script [ RP.src "/sioconfig" ] []
  , R.script [ RP.src "/js/util.js" ] []
  , R.script [ RP.src "/js/paginator.js" ] []
  , R.script [ RP.src "/js/chart.js" ] []
  , R.script [ RP.src "/js/acp.js" ] []
  ]



logViewer :: ReactElement
logViewer =
  R.div [ RP._id "acp-logview", RP.className "acp-panel col-md-12"
        , RP.style {"display": "none"}
        ]
        [ R.h3' [ R.text "Log Viewer" ]
        , R.div [ RP.className "input-group" ]
                [ R.div [ RP.className "input-group-btn" ]
                        [ R.button  [ RP._id "acp-syslog-btn"
                                    , RP.className "btn.btn-default"
                                    ]
                                    [ R.text "Syslog" ]
                        , R.button  [ RP._id "acp-errlog-btn"
                                    , RP.className "btn.btn-default"
                                    ]
                                    [ R.text "Error log" ]
                        , R.button  [ RP._id "acp-httplog-btn"
                                    , RP.className "btn.btn-default"
                                    ]
                                    [ R.text "HTTP log" ]
                        ]
                , I.text' [ RP._id "acp-chanlog-name"
                          , RP.className "form-control"
                          , RP.placeholder "Channel name" ]
                ]
        , R.pre [ RP._id "acp-log" ] []
        ]


announcements :: ReactElement
announcements =
  R.div [ RP._id "acp-announcements"
        , RP.className "acp-panel.col-md-6.col-md-offset-3"
        , RP.style {"display": "none"}
        ]
        [ R.h3' [ R.text "Announcements" ]
        , R.h3' [ R.text "New Announcement" ]
        , R.div' [ addAnnouncementForm ]
        ]

  where

  addAnnouncementForm :: ReactElement
  addAnnouncementForm =
    R.form  [ RP.className "form-horizontal"
            , RP.action "javascript:void(0)"
            , RP.role "form"
            ]
            [ R.div [ RP.className "form-group" ]
                    [ R.label [ RP.className "control-label.col-sm-2"
                              , RP.htmlFor "acp-announce-title"
                              ]
                              [ R.text "Title" ]
                    , R.div [ RP.className "col-sm-10" ]
                            [ I.text' [ RP._id "acp-announce-title"
                                      , RP.className "form-control" ]
                            ]
                    ]
            , R.div [ RP.className "form-group" ]
                    [ R.label [ RP.className "control-label.col-sm-2"
                              , RP.htmlFor "acp-announce-content"
                              ]
                              [ R.text "Text" ]
                    , R.div [ RP.className "col-sm-10" ]
                            [ R.textarea
                                [ RP._id "acp-announce-content"
                                , RP.className "form-control"
                                , RP._type "text"
                                , RP.rows "10"
                                ]
                                []
                            ]
                    ]
            , R.div [ RP.className "form-group" ]
                    [ R.div [ RP.className "col-sm-10 col-sm-offset-2" ]
                            [ R.button
                                [ RP._id "acp-announce-submit"
                                , RP.className "btn btn-primary"
                                ]
                                [ R.text "Announce" ]
                            ]
                    ]
            ]


globalBans :: ReactElement
globalBans =
  R.div [ RP._id "acp-global-bans"
        , RP.className "acp-panel col-md-12"
        , RP.style {"display": "none"}
        ]
        [ R.h3' [ R.text "Global Bans" ]
        , R.table [ RP.className "table.table-striped.table-bordered" ]
                  [ R.thead'
                      [ R.tr'
                          [ R.th' []
                          , R.th' [ R.text "IP Address" ]
                          , R.th' [ R.text "Note" ]
                          ]
                      ]
                  ]
        , R.h3' [ R.text "New Global Ban" ]
        , R.div [ RP.style { "max-width": "50%" } ] [ addBanForm ]
        ]

  where

  addBanForm :: ReactElement
  addBanForm =
    R.form  [ RP.className "form-horizontal"
            , RP.action "javascript:void(0)"
            , RP.role "form"
            ]
            [ R.div [ RP.className "form-group" ]
                    [ R.label [ RP.className "control-label col-sm-3"
                              , RP.htmlFor "acp-gban-ip"
                              ]
                              [ R.text "IP Address" ]
                    , R.div [ RP.className "col-sm-9" ]
                            [ I.text' [ RP._id "acp-gban-ip"
                                      , RP.className "form-control"
                                      ]
                            ]
                    ]
            , R.div [ RP.className "form-group" ]
                    [ R.label [ RP.className "control-label col-sm-3"
                              , RP.htmlFor "acp-gban-note"
                              ]
                              [ R.text "Note" ]
                    , R.div [ RP.className "col-sm-9" ]
                            [ I.text' [ RP._id "acp-gban-note"
                                      , RP.className "form-control"
                                      ]
                            ]
                    ]
            , R.div [ RP.className "form-group" ]
                    [ R.div [ RP.className "col-sm-9 col-sm-offset-3" ]
                            [ R.button  [ RP._id "acp-gban-submit"
                                        , RP.className "btn btn-danger"
                                        ]
                                        [ R.text "Add ban" ]
                            ]
                    ]
            ]


users :: ReactElement
users =
  R.div [ RP._id "acp-user-lookup"
        , RP.className "acp-panel col-md-12"
        , RP.style {"display": "none"}
        ]
        [ R.h3' [ R.text "Users" ]
        , R.div [ RP.className "input-group", RP.style { "max-width": "25%" } ]
                [ I.text' [ RP._id "acp-ulookup-name"
                          , RP.className "form-control"
                          ]
                , R.span  [ RP.className "input-group-btn" ]
                          [ R.button  [ RP._id "acp-ulookup-btn"
                                      , RP.className "btn btn-default"
                                      ]
                                      [ R.text "Search" ]
                          ]
                ]
        , R.table [ RP.className "table table-bordered table-striped"
                  , RP.style {"margin-top": "20px"}
                  ]
                  [ R.thead'
                      [ R.tr'
                          [ R.th  [ RP.className "sort"
                                  , RP._data {"key": "id"}
                                  ]
                                  [ R.text "ID" ]
                          , R.th  [ RP.className "sort"
                                  , RP._data {"key": "name"}
                                  ]
                                  [ R.text "Name" ]
                          , R.th  [ RP.className "sort"
                                  , RP._data {"key": "global_rank"}
                                  ]
                                  [ R.text "Rank" ]
                          , R.th  [ RP.className "sort"
                                  , RP._data {"key": "email"}
                                  ]
                                  [ R.text "Email" ]
                          , R.th' [ R.text "Actions" ]
                          ]
                      ]
                  ]
        ]


channels :: ReactElement
channels =
  R.div [ RP._id "acp-channel-lookup"
        , RP.className "acp-panel col-md-12"
        , RP.style {"display": "none"}
        ]
        [ R.h3' [ R.text "Channels" ]
        , searchChannelForm
        , R.table [ RP.className "table table-bordered table-striped"
                  , RP.style { "margin-top": "20px" }
                  ]
                  [ R.thead'
                      [ R.tr'
                          [ R.th  [ RP.className "sort"
                                  , RP._data { "key": "id" }
                                  ]
                                  [ R.text "ID" ]
                          , R.th  [ RP.className "sort"
                                  , RP._data { "key": "name" }
                                  ]
                                  [ R.text "Name" ]
                          , R.th  [ RP.className "sort"
                                  , RP._data { "key": "owner" }
                                  ]
                                  [ R.text "Owner" ]
                          , R.th' [ R.text "Control" ]
                          ]
                      ]
                  ]
        ]

  where

  searchChannelForm :: ReactElement
  searchChannelForm =
    R.form  [ RP.className "form-inline"
            , RP.action "javascript:void(0)"
            , RP.role "form"
            ]
            [ R.div [ RP.className "form-group" ]
                    [ I.text' [ RP._id "acp-clookup-value"
                              , RP.className "form-control"
                              , RP.placeholder "Name" ]
                    ]
            , R.div [ RP.className "form-group" ]
                    [ R.select  [ RP._id "acp-clookup-field"
                                , RP.className "form-control"
                                ]
                                [ R.option  [ RP.value "name" ]
                                            [ R.text "Channel Name" ]
                                , R.option  [ RP.value "owner" ]
                                            [ R.text "Channel Owner" ]
                                ]
                    ]
            , R.button  [ RP._id "acp-clookup-submit"
                        , RP.className "btn btn-default"
                        ]
                        [ R.text "Search" ]
            ]


loadedChannels :: ReactElement
loadedChannels =
  R.div
    [ RP._id "acp-loaded-channels"
    , RP.className "acp-panel col-md-12"
    , RP.style {"display": "none"}
    ]
    [ R.h3' [ R.text "Loaded Channels" ]
    , R.button  [ RP._id "acp-lchannels-refresh"
                , RP.className "btn btn-default"
                ]
                [ R.text "Refresh" ]
    , R.table   [ RP.className "table table-bordered table-striped"
                , RP.style { "margin-top": "20px" }
                ]
                [ R.thead'
                    [ R.tr'
                        [ R.th' [ R.text "Title" ]
                        , R.th' [ R.text "Usercount" ]
                        , R.th' [ R.text "Now Playing" ]
                        , R.th' [ R.text "Registered" ]
                        , R.th' [ R.text "Public" ]
                        , R.th' [ R.text "Control" ]
                        ]
                    ]
                ]
    ]


eventLog :: ReactElement
eventLog =
  R.div [ RP._id "acp-eventlog"
        , RP.className "acp-panel.col-md-12"
        , RP.style {"display": "none"}
        ]
        [ R.h3' [ R.text "Event Log" ]
        , R.strong' [ R.text "Filter event types" ]
        , R.select  [ RP._id "acp-eventlog-filter"
                    , RP.className "form-control"
                    , RP.multiple "multiple"
                    , RP.style { "max-width": "25%" }
                    ] []
        , R.button  [ RP._id "acp-eventlog-refresh"
                    , RP.className "btn btn-default"
                    ]
                    [ R.text "Refresh" ]
        , R.pre [ RP._id "acp-eventlog-text" ] []
        ]


stats :: ReactElement
stats =
  R.div [ RP._id "acp-stats"
        , RP.className "acp-panel.col-md-12"
        , RP.style { "display": "none" }
        ]
        [ R.h3' [ R.text "User Count" ]
        , R.canvas  [ RP._id "stat_users", RP.width "1140", RP.height "400" ] []
        , R.h3' [ R.text "Channel Count" ]
        , R.canvas  [ RP._id "stat_channels", RP.width "1140", RP.height "400" ]
                    []
        , R.h3' [ R.text "Memory Usage" ]
        , R.canvas  [ RP._id "stat_mem", RP.width "1140", RP.height "400" ] []
        ]
