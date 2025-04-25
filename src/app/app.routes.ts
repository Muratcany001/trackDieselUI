import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { AddPageComponent } from './pages/add-page/add-page.component';
import { SearchPageComponent } from './pages/search-page/search-page.component';
import { AiPageComponent } from './pages/ai-page/ai-page.component';
import { DeletePageComponent } from './pages/delete-page/delete-page.component';
import { MainPageComponent } from './pages/main-page/main-page.component';
import { UpdatePageComponent } from './pages/update-page/update-page.component';
import { UserPageComponent } from './pages/user-page/user-page.component';
import { SignupPageComponent } from './pages/signup-page/signup-page.component';
import { authGuard } from './guards/auth.guard';
import { RegisterPageComponent } from './pages/register-page/register-page.component';
import { ErrorPageComponent } from './pages/error-page/error-page.component';
import { LogoutComponent } from './pages/logout/logout.component';

export const routes: Routes = [
    {path : 'login', component:LoginComponent},
    {path : 'addPage', component:AddPageComponent, canActivate:[authGuard]},
    {path : 'searchPage', component:SearchPageComponent, canActivate:[authGuard]},
    {path : 'aiPage', component:AiPageComponent, canActivate:[authGuard]},
    {path : 'deletePage', component:DeletePageComponent, canActivate:[authGuard]},
    {path : 'mainPage', component:MainPageComponent, canActivate:[authGuard]},
    {path : 'updatePage', component:UpdatePageComponent, canActivate:[authGuard]},
    {path : 'userPage', component:UserPageComponent, canActivate:[authGuard]},
    {path : 'signupPage', component:SignupPageComponent},
    {path : 'registerPage', component:RegisterPageComponent},
    {path : 'errorPage', component:ErrorPageComponent},
    {path : 'logout', component:LogoutComponent},
    {path : '', redirectTo:'/login', pathMatch: 'full'}
];
