import { OCResource } from "./oc-resources";
import fs from 'fs';
import yaml from 'js-yaml';
import { log, MessageType } from '../services/log';
import axios from "axios";

export default class SeedFile {
    private file = {
        Objects: {},
        Assignments: {}
    }

    private GetTypeField(resource: OCResource) {
        return resource.isAssignment ? "Assignments" : "Objects";
    } 

    AddRecords(resource: OCResource, records: any[]) {
        var typeField = this.GetTypeField(resource);
        this.file[typeField][resource.name] = this.file[typeField][resource.name] || [];
        this.file[typeField][resource.name].push(...records);
    }

    GetRecords(resource: OCResource): any[] {
        var typeField = this.GetTypeField(resource);
        return this.file?.[typeField]?.[resource.name] || [];
    }

    WriteToYaml(filePath: string) {
        fs.writeFileSync(filePath, yaml.dump(this.file));
    }

    async ReadFromYaml(filePath: string, errors: string[]): Promise<boolean> {
        let raw;
        if (filePath.startsWith('http')) {
            try {
                raw = (await axios.get(filePath)).data;
                log(`Found \"${filePath}\".`, MessageType.Success);
            } catch {
                errors.push(`Error response from \"${filePath}\".`);
                return false;
            }
        } else {
            try {
                raw = fs.readFileSync(filePath, 'utf8') // consider switching to streams
                log(`Found file \"${filePath}\"`, MessageType.Success);
            } catch (err) {
                errors.push(`No such file or directory \"${filePath}\" found`);
                return false;
            }
        }
        try {
            this.file = yaml.load(raw) as any;
            log(`Valid yaml in \"${filePath}\"`, MessageType.Success);
        } catch (e) {
            var ex = e as YAMLException;
            errors.push(`YAML Exception in \"${filePath}\": ${ex.message}`)
            return false;
        }
        return true;
    }
}

interface YAMLException {
    name: string; // always "YAMLException"
    reason: string;
    message: string;
    stack: string; 
    mark: YAMLExceptionMark
}

interface YAMLExceptionMark {
    postion: number; 
    line: number;
    column: number;
    snippet: string; 
}