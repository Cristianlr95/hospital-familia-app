import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LinkPatientPage } from './pages/link-patient/link-patient.page';

const routes: Routes = [
  {
    path: '',
    component: LinkPatientPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LinkingRoutingModule {}
