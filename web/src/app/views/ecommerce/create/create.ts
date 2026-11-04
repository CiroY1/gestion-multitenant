import { PageTitle } from '@/app/components/page-title'
import { Component } from '@angular/core'
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap'
import { GeneralDEtail } from './components/general-detail/general-detail'
import { Metadata } from './components/metadata/metadata'
import { Finish } from './components/finish/finish'
import { FileUploader } from '@/app/components/file-uploader'

@Component({
  selector: 'app-create',
  standalone: true,
  imports: [
    PageTitle,
    NgbNavModule,
    GeneralDEtail,
    Metadata,
    Finish,
    FileUploader,
  ],
  templateUrl: './create.html',
})
export class Create {
  active = 1
  active1 = 1
}
