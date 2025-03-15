import { Component } from '@angular/core';
import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { AddPageComponent } from './pages/add-page/add-page.component';
import { SearchPageComponent } from './pages/search-page/search-page.component';
import { AiPageComponent } from './pages/ai-page/ai-page.component';
import { DeletePageComponent } from './pages/delete-page/delete-page.component';
import { MainPageComponent } from './pages/main-page/main-page.component';
import { UpdatePageComponent } from './pages/update-page/update-page.component';
import { UserPageComponent } from './pages/user-page/user-page.component';

export const routes: Routes = [
    {path : 'login', component:LoginComponent},
    {path : 'addPage', component:AddPageComponent},
    {path : 'searchPage', component:SearchPageComponent},
    {path : 'aiPage', component:AiPageComponent},
    {path : 'deletePage', component:DeletePageComponent},
    {path : 'mainPage', component:MainPageComponent},
    {path : 'updatePage', component:UpdatePageComponent},
    {path : 'userPage', component:UserPageComponent},
    {path : '', redirectTo:'/login', pathMatch: 'full'}
];
