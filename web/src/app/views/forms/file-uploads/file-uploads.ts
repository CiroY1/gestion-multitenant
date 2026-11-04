import { FileUploader } from '@/app/components/file-uploader'
import { PageTitle } from '@/app/components/page-title'
import { Component } from '@angular/core'

@Component({
  selector: 'app-file-uploads',
  standalone: true,
  imports: [PageTitle, FileUploader],
  templateUrl: './file-uploads.html',
  styles: ``,
})
export class FileUploads {}
