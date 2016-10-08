module Synctube.Client.Page where

import Prelude

import Synctube.Client.Page.Index as PageIndex
import Synctube.Client.Page.AccountChannels as PageAccountChannels
import Synctube.Client.Page.AccountEdit as PageAccountEdit
import Synctube.Client.Page.AccountPasswordRecover as PageAccountPasswordRecover
import Synctube.Client.Page.AccountPasswordReset as PageAccountPasswordReset
import Synctube.Client.Page.AccountProfile as PageAccountProfile
import Synctube.Client.Page.Acp as PageAcp
import Synctube.Client.Page.Channel as PageChannel
import Synctube.Client.Page.Contact as PageContact
import Synctube.Client.Page.CsrfError as PageCsrfError
import Synctube.Client.Page.GoogleDriveUserscript as PageGoogleDriveUserscript
import Synctube.Client.Page.HttpError as PageHttpError
import Synctube.Client.Page.Login as PageLogin
import Synctube.Client.Page.Logout as PageLogout
import Synctube.Client.Page.Register as PageRegister
import Synctube.Client.Page.Tos as PageTos


data Page
  = Index PageIndex.State
  | AccountChannels PageAccountChannels.State
  | AccountEdit PageAccountEdit.State
  | AccountPasswordRecover PageAccountPasswordRecover.State
  | AccountPasswordReset PageAccountPasswordReset.State
  | AccountProfile PageAccountProfile.State
  | Acp PageAcp.State
  | Channel PageChannel.State
  | Contact PageContact.State
  | CsrfError PageCsrfError.State
  | GoogleDriveUserscript PageGoogleDriveUserscript.State
  | HttpError PageHttpError.State
  | Login PageLogin.State
  | Logout PageLogout.State
  | Register PageRegister.State
  | Tos PageTos.State


defaultLinksUrl :: Page -> String
defaultLinksUrl = case _ of
  Index _ -> "/"
  AccountChannels _ -> "/account/channels"
  AccountEdit _ -> "/account/edit"
  AccountPasswordRecover _ -> "/account/passwordrecover/"
  AccountPasswordReset _ -> "/account/passwordreset"
  AccountProfile _ -> "/account/profile"
  Acp _ -> "/acp"
  Channel state -> "/r/" <> state.channel.name
  Contact _ -> "/contact"
  CsrfError _ -> "CURRENT_PAGE"
  GoogleDriveUserscript _ -> "/google_drive_userscript"
  HttpError _ -> "CURRENT_PAGE"
  Login _ -> "/login"
  Logout _ -> "/logout"
  Register _ -> "/register"
  Tos _ -> "/useragreement"
